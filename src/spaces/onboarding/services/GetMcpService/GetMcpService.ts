import { NetworkStatus } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

import {
  GetMcpV2Document,
  GetMcpV2Query,
  GetMcpV2QueryVariables,
} from '../../../../types/__generated__/graphql/graphql';
import { ControlPlaneType, ControlPlaneStatusType, ReadyStatus } from '../../../../lib/api/types/crate/controlPlanes';

type McpV2Item = NonNullable<NonNullable<GetMcpV2Query['core_openmcp_cloud']>['v2alpha1']>['ManagedControlPlaneV2'];
type McpV2Condition = NonNullable<NonNullable<NonNullable<McpV2Item>['status']>['conditions']>[number];

function parseAccess(accessData: unknown): ControlPlaneStatusType['access'] {
  if (!accessData) return undefined;

  try {
    const parsed = typeof accessData === 'string' ? JSON.parse(accessData) : accessData;
    return {
      key: parsed.key,
      name: parsed.name,
      namespace: parsed.namespace,
      kubeconfig: undefined,
    };
  } catch {
    return undefined;
  }
}

function mapMcpV2Item(item: McpV2Item): ControlPlaneType | undefined {
  if (!item) return undefined;

  const annotations = item.metadata?.annotations;

  return {
    metadata: {
      name: item.metadata?.name ?? '',
      namespace: item.metadata?.namespace ?? '',
      creationTimestamp: item.metadata?.creationTimestamp ?? '',
      annotations:
        annotations && typeof annotations === 'object'
          ? (annotations as ControlPlaneType['metadata']['annotations'])
          : undefined,
    },
    isV2: true,
    spec: undefined,
    status: item.status
      ? {
          status: (item.status.phase as ReadyStatus) ?? ReadyStatus.NotReady,
          conditions: (item.status.conditions ?? []).map((condition: McpV2Condition) => ({
            type: condition?.type ?? '',
            status: condition?.status ?? '',
            reason: condition?.reason ?? '',
            message: condition?.message ?? '',
            lastTransitionTime: condition?.lastTransitionTime ?? '',
          })),
          access: parseAccess(item.status.access),
        }
      : undefined,
  };
}

export function useGetMcpV2Query(name?: string, namespace?: string) {
  const queryResult = useQuery<GetMcpV2Query, GetMcpV2QueryVariables>(GetMcpV2Document, {
    variables: { name: name ?? '', namespace },
    skip: !name || !namespace,
    notifyOnNetworkStatusChange: true,
  });

  const isPending = queryResult.networkStatus === NetworkStatus.loading;

  const rawItem = queryResult.data?.core_openmcp_cloud?.v2alpha1?.ManagedControlPlaneV2;
  const controlPlane = rawItem ? mapMcpV2Item(rawItem) : undefined;

  return {
    data: controlPlane,
    error: queryResult.error,
    isPending,
  };
}
