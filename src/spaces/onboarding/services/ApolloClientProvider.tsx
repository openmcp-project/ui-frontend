import { ApolloClient, ApolloLink, InMemoryCache, Observable, split } from '@apollo/client';
import { ServerError } from '@apollo/client/errors';
import { ApolloProvider } from '@apollo/client/react';
import { HttpLink } from '@apollo/client/link/http';
import { ErrorLink } from '@apollo/client/link/error';
import { getMainDefinition } from '@apollo/client/utilities';
import { ClientOptions, createClient } from 'graphql-sse';
import { print, ExecutionResult, FormattedExecutionResult } from 'graphql';
import { ReactNode } from 'react';
import { refreshToken } from '../auth/tokenRefresh';
import { redirectToLogin } from '../../../common/auth/redirectToLogin';

const graphqlUrl = '/api/graphql';

// SSE Link using graphql-sse library.
// A single client is created per SSELink instance and reused across all
// subscriptions so they multiplex over one persistent SSE connection.
class SSELink extends ApolloLink {
  private client: ReturnType<typeof createClient>;

  constructor(options: ClientOptions) {
    super();
    this.client = createClient(options);
  }

  public override request(
    operation: Parameters<ApolloLink['request']>[0],
  ): Observable<ExecutionResult | FormattedExecutionResult> {
    return new Observable((sink) => {
      return this.client.subscribe(
        { ...operation, query: print(operation.query) },
        {
          next: sink.next.bind(sink),
          complete: sink.complete.bind(sink),
          error: sink.error.bind(sink),
        },
      );
    });
  }
}

const httpLink = new HttpLink({
  uri: graphqlUrl,
});

const authLink = new ApolloLink((operation, forward) => {
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      'x-use-crate': 'true',
    },
  }));

  return forward(operation);
});

const sseLink = new SSELink({
  url: graphqlUrl,
  headers: { 'x-use-crate': 'true' },
});

// Split: SSE for subscriptions, HTTP for queries/mutations
// Ensure `authLink` runs before the split so subscription operations
// get the same `operation.setContext` headers as queries/mutations.
const splitLink = authLink.concat(
  split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
    },
    sseLink,
    httpLink,
  ),
);

const isSubscription = (operation: Parameters<ApolloLink['request']>[0]) => {
  const definition = getMainDefinition(operation.query);
  return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
};

/**
 * Token refresh link that ensures valid token before each GraphQL request.
 * Skipped for subscriptions — the SSE connection is same-origin (cookie-based)
 * and does not need per-operation token validation. Checking the token for
 * every subscription mount serialises them through pendingRefresh, blocking queries.
 */
const tokenRefreshLink = new ApolloLink((operation, forward) => {
  if (isSubscription(operation)) {
    return forward(operation);
  }

  return new Observable<ExecutionResult | FormattedExecutionResult>((observer) => {
    let subscription: { unsubscribe(): void } | null = null;
    let isUnsubscribed = false;

    refreshToken()
      .then((valid) => {
        if (isUnsubscribed) return;

        if (!valid) {
          // So far we only connect to the Onboarding API, so we can hardcode the flow here.
          redirectToLogin('onboarding');
          observer.error(new Error('Session expired'));
          return;
        }

        subscription = forward!(operation).subscribe({
          next: (value) => !isUnsubscribed && observer.next(value),
          error: (err) => !isUnsubscribed && observer.error(err),
          complete: () => !isUnsubscribed && observer.complete(),
        });
      })
      .catch((err) => {
        if (!isUnsubscribed) observer.error(err);
      });

    return () => {
      isUnsubscribed = true;
      subscription?.unsubscribe();
    };
  });
});

/**
 * Reacts to a 401 that comes *back* from the server (token looked valid to the
 * client but was rejected — clock skew, backgrounded tab, revoked session).
 * Forces a token refresh and retries the operation once; if the forced refresh
 * fails, redirects to sign-in. Guarded via operation context so a persistently
 * 401ing server can't loop.
 */
const RETRIED_CONTEXT_KEY = 'auth401Retried';

const errorLink = new ErrorLink(({ error, operation, forward }) => {
  if (!ServerError.is(error) || error.statusCode !== 401) {
    return;
  }

  if (operation.getContext()[RETRIED_CONTEXT_KEY]) {
    // Already retried once and still 401 → the forced refresh didn't help.
    redirectToLogin('onboarding');
    return;
  }

  return new Observable<ExecutionResult | FormattedExecutionResult>((observer) => {
    let subscription: { unsubscribe(): void } | null = null;
    let isUnsubscribed = false;

    refreshToken(true)
      .then((valid) => {
        if (isUnsubscribed) return;

        if (!valid) {
          redirectToLogin('onboarding');
          observer.error(error);
          return;
        }

        operation.setContext({ [RETRIED_CONTEXT_KEY]: true });
        subscription = forward(operation).subscribe({
          next: (value) => !isUnsubscribed && observer.next(value),
          error: (err) => !isUnsubscribed && observer.error(err),
          complete: () => !isUnsubscribed && observer.complete(),
        });
      })
      .catch((err) => {
        if (!isUnsubscribed) observer.error(err);
      });

    return () => {
      isUnsubscribed = true;
      subscription?.unsubscribe();
    };
  });
});

const client = new ApolloClient({
  link: ApolloLink.from([errorLink, tokenRefreshLink, splitLink]),
  // Explicit even though it's the default: several list views (e.g. ProjectsList) mount the
  // same query+variables from multiple sibling components on the same render, relying on
  // Apollo coalescing concurrent identical requests into a single network call.
  queryDeduplication: true,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          core_openmcp_cloud: { merge: true },
          core_open_control_plane_io: { merge: true },
        },
      },
      CoreOpenmcpCloudQuery: { merge: true },
      CoreOpenmcpCloudV1alpha1Query: { merge: true },
      CoreOpenControlPlaneIoQuery: { merge: true },
      CoreOpenControlPlaneIoV2alpha1Query: { merge: true },
      V1Query: { merge: true },
      // Normalize K8s entities by `metadata.uid` so the same object fetched via different
      // queries (e.g. GetMCPsList vs GetManagedControlPlane, GetProject vs GetProjectMembers)
      // shares one cache entry instead of each query caching its own disconnected copy.
      // Every query that selects one of these types must include `metadata { uid }` — a query
      // that omits it degrades gracefully to a one-off, non-normalized cache write for that
      // response (Apollo warns, it doesn't throw).
      CoreOpenmcpCloudV1alpha1ManagedControlPlane: { keyFields: ['metadata', ['uid']] },
      CoreOpenmcpCloudV1alpha1Project: { keyFields: ['metadata', ['uid']] },
      CoreOpenmcpCloudV1alpha1Workspace: { keyFields: ['metadata', ['uid']] },
      CoreOpenControlPlaneIoV2alpha1ControlPlane: { keyFields: ['metadata', ['uid']] },
    },
  }),
});

export function ApolloClientProvider({ children }: { children: ReactNode }) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
