import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { HttpLink } from '@apollo/client/link/http';
import { ReactNode } from 'react';

export function ApolloClientProvider({ children }: { children: ReactNode }) {
  const graphqlUrl = '/api/graphql';

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

  const client = new ApolloClient({
    link: ApolloLink.from([authLink, httpLink]),
    cache: new InMemoryCache(),
  });

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
