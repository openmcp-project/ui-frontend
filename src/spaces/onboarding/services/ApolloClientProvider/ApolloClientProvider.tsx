import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { HttpLink } from '@apollo/client/link/http';
import { ReactNode } from 'react';
import { useFrontendConfig } from '../../../../context/FrontendConfigContext.tsx';

export function ApolloClientProvider({ children }: { children: ReactNode }) {
  const { gatewayUrl } = useFrontendConfig();
  const graphqlUrl = gatewayUrl.startsWith('/') ? gatewayUrl : '/api/graphql';
  console.log('Gateway URL:', graphqlUrl);

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
