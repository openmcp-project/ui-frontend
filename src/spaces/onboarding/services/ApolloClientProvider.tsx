import { ApolloClient, ApolloLink, InMemoryCache, Observable } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { HttpLink } from '@apollo/client/link/http';
import { ReactNode } from 'react';
import { refreshToken } from '../auth/tokenRefresh';
import { redirectToLogin } from '../../../common/auth/redirectToLogin';

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
  link: ApolloLink.from([tokenRefreshLink, authLink, httpLink]),
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
