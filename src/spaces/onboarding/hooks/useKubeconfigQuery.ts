import { NetworkStatus } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';

import { z } from 'zod';

import { graphql } from '../../../types/__generated__/graphql';

const GET_KUBECONFIG_QUERY = graphql(`
  query GetKubeconfig($kubeConfigName: String!, $namespaceName: String) {
    v1 {
      Secret(name: $kubeConfigName, namespace: $namespaceName) {
        data
      }
    }
  }
`);

const KubeconfigDataSchema = z.record(z.string(), z.string());

type KubeconfigData = z.infer<typeof KubeconfigDataSchema> | undefined;

export function useKubeconfigQuery(kubeConfigName?: string, namespaceName?: string) {
  const queryResult = useQuery(GET_KUBECONFIG_QUERY, {
    variables: { kubeConfigName: kubeConfigName ?? '', namespaceName },
    skip: !kubeConfigName || !namespaceName,
    notifyOnNetworkStatusChange: true,
  });

  const isPending = queryResult.networkStatus === NetworkStatus.loading;
  const rawData = queryResult.data?.v1?.Secret?.data;

  const data = useMemo<KubeconfigData>(() => {
    if (!rawData) return undefined;
    const result = KubeconfigDataSchema.safeParse(rawData);
    if (!result.success) {
      console.warn('[useKubeconfigQuery] Validation failed:', z.treeifyError(result.error));
      return undefined;
    }
    return result.data;
  }, [rawData]);

  return {
    data,
    error: queryResult.error,
    isPending,
  };
}
