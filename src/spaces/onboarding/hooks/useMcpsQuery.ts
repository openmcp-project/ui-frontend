import { useMemo } from 'react';
import { NetworkStatus } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { z } from 'zod';

import { graphql } from '../../../types/__generated__/graphql';
import { GetMcPsListQuery } from '../../../types/__generated__/graphql/graphql';
import { ControlPlaneListItem, ControlPlaneListItemSchema } from '../types/ControlPlane';
import { useFeatureToggle } from '../../../context/FeatureToggleContext';

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

type V1Item = NonNullable<
  NonNullable<GetMcPsListQuery['core_openmcp_cloud']>['v1alpha1']
>['ManagedControlPlanes']['items'][number];
type V2Item = NonNullable<
  NonNullable<GetMcPsListQuery['core_openmcp_cloud']>['v2alpha1']
>['ManagedControlPlaneV2s']['items'][number];

function toV1Input(item: V1Item) {
  return {
    version: 'v1' as const,
    metadata: item.metadata,
    status: item.status
      ? {
          status: item.status.status,
          conditions: item.status.conditions,
          access: item.status.components?.authentication?.access,
        }
      : null,
  };
}

/** Parses the v2 access field which may arrive as a JSON string or an object. */
function parseAccess(accessData: unknown): Record<string, unknown> | undefined {
  if (!accessData) return undefined;
  try {
    const parsed = typeof accessData === 'string' ? JSON.parse(accessData) : accessData;
    return parsed as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function toV2Input(item: V2Item) {
  return {
    version: 'v2' as const,
    metadata: item.metadata,
    status: item.status
      ? {
          status: item.status.phase,
          conditions: item.status.conditions,
          access: parseAccess(item.status.access),
        }
      : null,
  };
}

export function useMcpsQuery(workspaceNamespace?: string) {
  const { enableMcpV2 } = useFeatureToggle();

  const queryResult = useQuery(GET_MCPS_LIST_QUERY, {
    variables: { workspaceNamespace: workspaceNamespace ?? '' },
    skip: !workspaceNamespace,
    // TODO: replace with a GraphQL subscription
    notifyOnNetworkStatusChange: true,
  });

  const v1Items = queryResult.data?.core_openmcp_cloud?.v1alpha1?.ManagedControlPlanes?.items;
  const v2Items = queryResult.data?.core_openmcp_cloud?.v2alpha1?.ManagedControlPlaneV2s?.items;

  const controlPlanes = useMemo<ControlPlaneListItem[]>(() => {
    const v1 = (v1Items ?? []).map(toV1Input);
    const v2 = enableMcpV2 ? (v2Items ?? []).map(toV2Input) : [];

    return [...v1, ...v2].flatMap((item) => {
      const result = ControlPlaneListItemSchema.safeParse(item);
      if (!result.success) {
        console.warn('Invalid control plane data:', z.treeifyError(result.error), item);
        return [];
      }
      return [result.data];
    });
  }, [v1Items, v2Items, enableMcpV2]);

  const isPending = queryResult.loading && queryResult.networkStatus === NetworkStatus.loading;

  return { data: controlPlanes, error: queryResult.error, isPending };
}
