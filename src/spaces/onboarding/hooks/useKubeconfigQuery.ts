import { gql, NetworkStatus } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const GET_KUBECONFIG_QUERY = gql`
  query GetKubeconfig($kubeConfigName: String!, $namespaceName: String) {
    v1 {
      Secret(name: $kubeConfigName, namespace: $namespaceName) {
        data
      }
    }
  }
`;

type KubeconfigData = Record<string, string> | null | undefined;

interface GetKubeconfigQueryResult {
  v1?: {
    Secret?: {
      data?: KubeconfigData;
    } | null;
  } | null;
}

export function useKubeconfigQuery(kubeConfigName?: string, namespaceName?: string) {
  const queryResult = useQuery<GetKubeconfigQueryResult>(GET_KUBECONFIG_QUERY, {
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
