import { ApolloClient, ApolloLink, FetchResult, InMemoryCache, Observable, Operation, split } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { HttpLink } from '@apollo/client/link/http';
import { getMainDefinition } from '@apollo/client/utilities';
import { Client, ClientOptions, createClient } from 'graphql-sse';
import { print } from 'graphql';
import { ReactNode } from 'react';

const graphqlUrl = '/api/graphql';

// SSE Link using graphql-sse library
class SSELink extends ApolloLink {
  private client: Client;

  constructor(options: ClientOptions) {
    super();
    this.client = createClient(options);
  }

  public override request(operation: Operation): Observable<FetchResult> {
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
  headers: {
    'x-use-crate': 'true',
  },
});

// Split: SSE for subscriptions, HTTP for queries/mutations
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  },
  sseLink,
  ApolloLink.from([authLink, httpLink]),
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

export function ApolloClientProvider({ children }: { children: ReactNode }) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
