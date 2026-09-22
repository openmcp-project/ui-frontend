import { NetworkStatus } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';

import { z } from 'zod';

import { graphql } from '../../../types/__generated__/graphql';
import { telemetry, useTelemetry } from '../../../lib/telemetry/telemetry.ts';

export const GET_KUBECONFIG_QUERY = graphql(`
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

export function decodeKubeconfigYaml(rawData: unknown, secretKey: string): string | undefined {
  if (!rawData) return undefined;
  const result = KubeconfigDataSchema.safeParse(rawData);
  if (!result.success) {
    telemetry().report(result.error, {
      message: 'Invalid kubeconfig Secret data — schema mismatch',
      context: { issues: z.treeifyError(result.error) },
    });
    return undefined;
  }
  const base64 = result.data[secretKey];
  if (!base64) return undefined;
  try {
    return atob(base64);
  } catch (error) {
    telemetry().report(error, {
      message: `Failed to decode secret value for key "${secretKey}"`,
      context: { item: base64 },
    });
    return undefined;
  }
}

export function useKubeconfigQuery(kubeConfigName?: string, namespaceName?: string, secretKey?: string) {
  const telemetry = useTelemetry();
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
      telemetry.report(result.error, {
        message: 'Invalid kubeconfig Secret data — schema mismatch',
        context: { issues: z.treeifyError(result.error) },
      });
      return undefined;
    }
    return result.data;
  }, [rawData, telemetry]);

  const kubeconfigDecoded = useMemo<string | undefined>(() => {
    if (!data || !secretKey) return undefined;
    const base64 = data[secretKey];
    if (!base64) return undefined;

    try {
      return atob(base64);
    } catch (error) {
      telemetry.report(error, {
        message: `Failed to decode secret value for key "${secretKey}"`,
        context: { item: base64 },
      });
      return undefined;
    }
  }, [data, secretKey, telemetry]);

  return {
    data,
    kubeconfigDecoded,
    error: queryResult.error,
    isPending,
  };
}
