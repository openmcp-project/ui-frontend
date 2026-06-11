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
        v1mcps: ManagedControlPlanes(namespace: $workspaceNamespace) {
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
        v2mcps: ManagedControlPlanes(namespace: $workspaceNamespace) {
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
    }
  }
`);

type V1Item = NonNullable<
  NonNullable<GetMcPsListQuery['core_openmcp_cloud']>['v1alpha1']
>['v1mcps']['items'][number];
type V2Item = NonNullable<
  NonNullable<GetMcPsListQuery['core_openmcp_cloud']>['v1alpha1']
>['v2mcps']['items'][number];

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


function toV2Input(item: V2Item) {
  return {
    version: 'v2' as const,
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

export function useMcpsQuery(workspaceNamespace?: string) {
  const { enableMcpV2 } = useFeatureToggle();

  const queryResult = useQuery(GET_MCPS_LIST_QUERY, {
    variables: { workspaceNamespace: workspaceNamespace ?? '' },
    skip: !workspaceNamespace,
    // TODO: replace with a GraphQL subscription
    notifyOnNetworkStatusChange: true,
  });

  const v1Items = queryResult.data?.core_openmcp_cloud?.v1alpha1?.v1mcps?.items;
  const v2Items = queryResult.data?.core_openmcp_cloud?.v1alpha1?.v2mcps?.items;

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
