import { ApolloClient, ApolloLink, InMemoryCache, Observable } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { HttpLink } from '@apollo/client/link/http';
import { ReactNode } from 'react';
import { refreshToken } from '../../auth/tokenRefresh';
import { redirectToLogin } from '../../../../common/auth/redirectToLogin';

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

/**
 * Token refresh link that ensures valid token before each GraphQL request.
 */
const tokenRefreshLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    refreshToken()
      .then((valid) => {
        if (!valid) {
          // So far we only connect to the Onboarding API, so we can hardcode the flow here.
          redirectToLogin('onboarding');
          observer.error(new Error('Session expired'));
          return;
        }
        const subscription = forward(operation).subscribe({
          next: observer.next.bind(observer),
          error: observer.error.bind(observer),
          complete: observer.complete.bind(observer),
        });
        return () => subscription.unsubscribe();
      })
      .catch((err) => observer.error(err));
  });
});

const client = new ApolloClient({
  link: ApolloLink.from([tokenRefreshLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});

export function ApolloClientProvider({ children }: { children: ReactNode }) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
