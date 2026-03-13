import { ApolloClient, ApolloLink, FetchResult, InMemoryCache, Observable, Operation, split } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { HttpLink } from '@apollo/client/link/http';
import { getMainDefinition } from '@apollo/client/utilities';
import { ClientOptions, createClient } from 'graphql-sse';
import { print } from 'graphql';
import { ReactNode } from 'react';

const graphqlUrl = '/api/graphql';

// SSE Link using graphql-sse library
class SSELink extends ApolloLink {
  private options: ClientOptions;

  constructor(options: ClientOptions) {
    super();
    this.options = options;
  }

  public override request(operation: Operation): Observable<FetchResult> {
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

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

export function ApolloClientProvider({ children }: { children: ReactNode }) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
