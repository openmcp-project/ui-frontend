import { NetworkStatus, ServerError } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

import { graphql } from '../../../../types/__generated__/graphql';
import { ControlPlaneType, ControlPlaneStatusType, ReadyStatus } from '../../../../lib/api/types/crate/controlPlanes';
import { APIError } from '../../../../lib/api/error';

const GetMCPsListQuery = graphql(`
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
  NonNullable<
    NonNullable<
      NonNullable<ReturnType<typeof useQuery<typeof GetMCPsListQuery>>['data']>['core_openmcp_cloud']
    >['v1alpha1']
  >['ManagedControlPlanes']
>['items'][number];

type V2Item = NonNullable<
  NonNullable<
    NonNullable<
      NonNullable<ReturnType<typeof useQuery<typeof GetMCPsListQuery>>['data']>['core_openmcp_cloud']
    >['v2alpha1']
  >['ManagedControlPlaneV2s']
>['items'][number];

function mapV1Item(item: V1Item): ControlPlaneType {
  return {
    metadata: {
      name: item.metadata?.name ?? '',
      namespace: item.metadata?.namespace ?? '',
      creationTimestamp: item.metadata?.creationTimestamp ?? '',
      annotations: item.metadata?.annotations,
    },
    spec: undefined,
    status: item.status
      ? {
          status: (item.status.status as ReadyStatus) ?? ReadyStatus.NotReady,
          conditions: (item.status.conditions ?? []).map((c) => ({
            type: c?.type ?? '',
            status: c?.status ?? '',
            reason: c?.reason ?? '',
            message: c?.message ?? '',
            lastTransitionTime: c?.lastTransitionTime ?? '',
          })),
          access: item.status.components?.authentication?.access
            ? {
                key: item.status.components.authentication.access.key ?? undefined,
                name: item.status.components.authentication.access.name ?? undefined,
                namespace: item.status.components.authentication.access.namespace ?? undefined,
                kubeconfig: undefined,
              }
            : undefined,
        }
      : undefined,
  };
}

function mapV2Item(item: V2Item): ControlPlaneType {
  let access: ControlPlaneStatusType['access'] = undefined;
  if (item.status?.access) {
    try {
      const parsed = JSON.parse(item.status.access as string);
      access = {
        key: parsed.key ?? undefined,
        name: parsed.name ?? undefined,
        namespace: parsed.namespace ?? undefined,
        kubeconfig: undefined,
      };
    } catch {
      // leave access undefined if JSON is malformed
    }
  }

  return {
    metadata: {
      name: item.metadata?.name ?? '',
      namespace: item.metadata?.namespace ?? '',
      creationTimestamp: item.metadata?.creationTimestamp ?? '',
      annotations: item.metadata?.annotations,
    },
    spec: undefined,
    status: item.status
      ? {
          status: (item.status.phase as ReadyStatus) ?? ReadyStatus.NotReady,
          conditions: (item.status.conditions ?? []).map((c) => ({
            type: c?.type ?? '',
            status: c?.status ?? '',
            reason: c?.reason ?? '',
            message: c?.message ?? '',
            lastTransitionTime: c?.lastTransitionTime ?? '',
          })),
          access,
        }
      : undefined,
  };
}

function toAPIError(apolloError: ReturnType<typeof useQuery>['error']): APIError | undefined {
  if (!apolloError) return undefined;
  const networkError = apolloError.networkError as ServerError | null;
  const status = networkError?.statusCode ?? 500;
  return new APIError(apolloError.message, status);
}

export function useMCPsListQuery(workspaceNamespace?: string) {
  const query = useQuery(GetMCPsListQuery, {
    variables: { workspaceNamespace: workspaceNamespace ?? '' },
    skip: !workspaceNamespace,
    pollInterval: 10000,
    notifyOnNetworkStatusChange: true,
  });

  const isPending = query.loading && query.networkStatus === NetworkStatus.loading;

  const v1Items = query.data?.core_openmcp_cloud?.v1alpha1?.ManagedControlPlanes?.items ?? [];
  const v2Items = query.data?.core_openmcp_cloud?.v2alpha1?.ManagedControlPlaneV2s?.items ?? [];

  const data: ControlPlaneType[] = [...v1Items.map(mapV1Item), ...v2Items.map(mapV2Item)];

  return {
    data,
    error: toAPIError(query.error),
    isPending,
  };
}
