import { ApolloClient, ApolloProvider, createHttpLink, InMemoryCache } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { ReactNode } from 'react';
import { useFrontendConfig } from '../../../../context/FrontendConfigContext.tsx';

export function ApolloClientProvider({ children }: { children: ReactNode }) {
  const { gatewayUrl } = useFrontendConfig();

  const httpLink = createHttpLink({
    uri: gatewayUrl,
  });

  const authLink = setContext((_, { headers }) => {
    return {
      headers: {
        ...headers,
        //authorization: `bearer ${auth.user?.access_token}`, // TODO
      },
    };
  });

  const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  });

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
