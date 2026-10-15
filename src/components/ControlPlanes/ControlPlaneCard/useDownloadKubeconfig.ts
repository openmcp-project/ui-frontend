import { useCallback } from 'react';
import { useApolloClient } from '@apollo/client/react';
import { GET_KUBECONFIG_QUERY, decodeKubeconfigYaml } from '../../../spaces/onboarding/hooks/useKubeconfigQuery.ts';
import { DownloadKubeconfig } from '../CopyKubeconfigButton.tsx';

export function useDownloadKubeconfig(namespace: string) {
  const client = useApolloClient();

  return useCallback(
    async (secretName: string, displayName: string): Promise<boolean> => {
      try {
        const { data } = await client.query({
          query: GET_KUBECONFIG_QUERY,
          variables: { kubeConfigName: secretName, namespaceName: namespace },
          fetchPolicy: 'network-only',
        });
        const yaml = decodeKubeconfigYaml(data?.v1?.Secret?.data, 'kubeconfig');
        DownloadKubeconfig(yaml, displayName);
        return !!yaml;
      } catch {
        return false;
      }
    },
    [client, namespace],
  );
}
