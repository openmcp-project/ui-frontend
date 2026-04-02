import { NetworkStatus } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

import { graphql } from '../../../../types/__generated__/graphql';
import { GetKubeconfigQuery } from '../../../../types/__generated__/graphql/graphql';

const GET_KUBECONFIG_QUERY = graphql(`
  query GetKubeconfig($kubeConfigName: String!, $namespaceName: String) {
    v1 {
      Secret(name: $kubeConfigName, namespace: $namespaceName) {
        data
      }
    }
  }
`);

type KubeconfigData = NonNullable<NonNullable<GetKubeconfigQuery['v1']>['Secret']>['data'];

export function useGetKubeconfig(kubeConfigName?: string, namespaceName?: string) {
  const queryResult = useQuery(GET_KUBECONFIG_QUERY, {
    variables: { kubeConfigName: kubeConfigName ?? '', namespaceName },
    skip: !kubeConfigName || !namespaceName,
    notifyOnNetworkStatusChange: true,
  });

  const isPending = queryResult.networkStatus === NetworkStatus.loading;
  const data: KubeconfigData = queryResult.data?.v1?.Secret?.data;

  return {
    data,
    error: queryResult.error,
    isPending,
  };
}
