import { NetworkStatus, ServerError } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

import { graphql } from '../../../../types/__generated__/graphql';
import {
  GetMcPsListQuery,
  ManagedControlPlanestatusstatusconditions,
  ManagedControlPlaneV2statusstatusconditions,
} from '../../../../types/__generated__/graphql/graphql';
import { ControlPlaneType, ControlPlaneStatusType, ReadyStatus } from '../../../../lib/api/types/crate/controlPlanes';
import { APIError } from '../../../../lib/api/error';
import { useFeatureToggle } from '../../../../context/FeatureToggleContext.tsx';

const GET_MCPS_LIST_QUERY = graphql(`
  query GetMCPsList($workspaceNamespace: String!) {
    core_openmcp_cloud {
      v1alpha1 {
        ManagedControlPlanes(namespace: $workspaceNamespace) {
          items {
            metadata {
              name
              namespace
              creationTimestamp
              annotations
            }
            status {
              status
              conditions {
                type
                status
                reason
                message
                lastTransitionTime
              }
              components {
                authentication {
                  access {
                    key
                    name
                    namespace
                  }
                }
              }
            }
          }
        }
      }
      v2alpha1 {
        ManagedControlPlaneV2s(namespace: $workspaceNamespace) {
          items {
            metadata {
              name
              namespace
              creationTimestamp
              annotations
            }
            status {
              phase
              conditions {
                type
                status
                reason
                message
                lastTransitionTime
              }
              access
            }
          }
        }
      }
    }
  }
`);
const GET_MCPS_LIST_MCP_V1_ONLY_QUERY = graphql(`
  query GetMCPsList($workspaceNamespace: String!) {
    core_openmcp_cloud {
      v1alpha1 {
        ManagedControlPlanes(namespace: $workspaceNamespace) {
          items {
            metadata {
              name
              namespace
              creationTimestamp
              annotations
            }
            status {
              status
              conditions {
                type
                status
                reason
                message
                lastTransitionTime
              }
              components {
                authentication {
                  access {
                    key
                    name
                    namespace
                  }
                }
              }
            }
          }
        }
      }
      v2alpha1 {
        ManagedControlPlaneV2s(namespace: $workspaceNamespace) {
          items {
            metadata {
              name
              namespace
              creationTimestamp
              annotations
            }
            status {
              phase
              conditions {
                type
                status
                reason
                message
                lastTransitionTime
              }
              access
            }
          }
        }
      }
    }
  }
`);

type V1Item = NonNullable<
  NonNullable<GetMcPsListQuery['core_openmcp_cloud']>['v1alpha1']
>['ManagedControlPlanes']['items'][number];
type V2Item = NonNullable<
  NonNullable<GetMcPsListQuery['core_openmcp_cloud']>['v2alpha1']
>['ManagedControlPlaneV2s']['items'][number];

function mapMetadata(metadata?: V1Item['metadata']) {
  return {
    name: metadata?.name ?? '',
    namespace: metadata?.namespace ?? '',
    creationTimestamp: metadata?.creationTimestamp ?? '',
    annotations: metadata?.annotations as ControlPlaneType['metadata']['annotations'],
  };
}

function mapCondition(
  condition: ManagedControlPlanestatusstatusconditions | ManagedControlPlaneV2statusstatusconditions | null | undefined,
): ControlPlaneStatusType['conditions'][number] {
  return {
    type: condition?.type ?? '',
    status: condition?.status ?? '',
    reason: condition?.reason ?? '',
    message: condition?.message ?? '',
    lastTransitionTime: condition?.lastTransitionTime ?? '',
  };
}

function parseAccess(accessData: unknown): ControlPlaneStatusType['access'] {
  if (!accessData) return undefined;

  try {
    const parsed = typeof accessData === 'string' ? JSON.parse(accessData) : accessData;
    return {
      key: parsed.key ?? undefined,
      name: parsed.name ?? undefined,
      namespace: parsed.namespace ?? undefined,
      kubeconfig: undefined,
    };
  } catch {
    return undefined;
  }
}

function mapV1Item(item: V1Item): ControlPlaneType {
  return {
    metadata: mapMetadata(item.metadata),
    spec: undefined,
    status: item.status
      ? {
          status: (item.status.status as ReadyStatus) ?? ReadyStatus.NotReady,
          conditions: (item.status.conditions ?? []).map(mapCondition),
          access: parseAccess(item.status.components?.authentication?.access),
        }
      : undefined,
  };
}

function mapV2Item(item: V2Item): ControlPlaneType {
  return {
    metadata: mapMetadata(item.metadata),
    spec: undefined,
    status: item.status
      ? {
          status: (item.status.phase as ReadyStatus) ?? ReadyStatus.NotReady,
          conditions: (item.status.conditions ?? []).map(mapCondition),
          access: parseAccess(item.status.access),
        }
      : undefined,
  };
}

export function useMCPsListQuery(workspaceNamespace?: string) {
  const { enableMcpV2 } = useFeatureToggle();
  const queryResult = useQuery(enableMcpV2 ? GET_MCPS_LIST_QUERY : GET_MCPS_LIST_MCP_V1_ONLY_QUERY, {
    variables: { workspaceNamespace: workspaceNamespace ?? '' },
    skip: !workspaceNamespace,
    notifyOnNetworkStatusChange: true,
  });

  const isPending = queryResult.loading && queryResult.networkStatus === NetworkStatus.loading;

  const v1Items = queryResult.data?.core_openmcp_cloud?.v1alpha1?.ManagedControlPlanes?.items ?? [];
  const v2Items = queryResult.data?.core_openmcp_cloud?.v2alpha1?.ManagedControlPlaneV2s?.items ?? [];

  const controlPlanes = [...v1Items.map(mapV1Item), ...v2Items.map(mapV2Item)];

  const error = queryResult.error
    ? new APIError(queryResult.error.message, (queryResult.error.networkError as ServerError | null)?.statusCode ?? 500)
    : undefined;

  return { data: controlPlanes, error, isPending };
}
