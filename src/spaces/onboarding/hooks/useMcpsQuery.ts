import { useMemo } from 'react';
import { NetworkStatus } from '@apollo/client';
import { ServerError } from '@apollo/client/errors';
import { useQuery } from '@apollo/client/react';
import { z } from 'zod';

import { graphql } from '../../../types/__generated__/graphql';
import { GetMcPsListQuery } from '../../../types/__generated__/graphql/graphql';
import { ControlPlaneListItem, ControlPlaneListItemSchema } from '../types/ControlPlane';
import { APIError } from '../../../lib/api/error';
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

function parseAccess(accessData: unknown): unknown {
  if (!accessData) return undefined;
  try {
    return typeof accessData === 'string' ? JSON.parse(accessData) : accessData;
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

  const isPending = queryResult.networkStatus === NetworkStatus.loading;

  const error = queryResult.error
    ? (() => {
        const networkError = (queryResult.error as { networkError?: unknown }).networkError;
        const statusCode = ServerError.is(networkError) ? networkError.statusCode : 500;
        return new APIError(queryResult.error.message, statusCode);
      })()
    : undefined;

  return { data: controlPlanes, error, isPending };
}
