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

// SSE Link using graphql-sse library
class SSELink extends ApolloLink {
  private options: ClientOptions;

  constructor(options: ClientOptions) {
    super();
    this.options = options;
  }

  public override request(
    operation: Parameters<ApolloLink['request']>[0],
  ): Observable<ExecutionResult | FormattedExecutionResult> {
    return new Observable((sink) => {
      const ctx = operation.getContext ? (operation.getContext() as { headers?: Record<string, string> }) : undefined;
      const ctxHeaders = ctx?.headers ?? undefined;
      const client = createClient({ ...this.options, headers: ctxHeaders ?? this.options.headers });

      return client.subscribe(
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

/**
 * Token refresh link that ensures valid token before each GraphQL request.
 */
const tokenRefreshLink = new ApolloLink((operation, forward) => {
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
        },
      },
      CoreOpenmcpCloudQuery: { merge: true },
      CoreOpenmcpCloudV1alpha1Query: { merge: true },
      CoreOpenmcpCloudV2alpha1Query: { merge: true },
    },
  }),
});

export function ApolloClientProvider({ children }: { children: ReactNode }) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
