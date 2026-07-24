import { ApolloClient, ApolloLink, InMemoryCache, Observable, split } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { HttpLink } from '@apollo/client/link/http';
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

const client = new ApolloClient({
  link: ApolloLink.from([tokenRefreshLink, splitLink]),
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
    },
  }),
});

export function ApolloClientProvider({ children }: { children: ReactNode }) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
