import { useCallback, useEffect, useMemo, useRef } from 'react';
import { NetworkStatus } from '@apollo/client';
import { useQuery, useSubscription } from '@apollo/client/react';
import { z } from 'zod';

import { graphql } from '../../../types/__generated__/graphql';
import { GetMcPsListQuery } from '../../../types/__generated__/graphql/graphql';
import { ControlPlaneListItem, ControlPlaneListItemSchema } from '../types/ControlPlane';
import { useFeatureToggle } from '../../../context/FeatureToggleContext';

export type McpsQueryMode = 'full' | 'minimal' | 'skip';

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
            spec {
              components {
                crossplane {
                  __typename
                }
                flux {
                  __typename
                }
                landscaper {
                  __typename
                }
                kyverno {
                  __typename
                }
                externalSecretsOperator {
                  __typename
                }
                btpServiceOperator {
                  __typename
                }
              }
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
    core_open_control_plane_io {
      v2alpha1 {
        ControlPlanes(namespace: $workspaceNamespace) {
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
              }
              access
            }
            spec {
              iam {
                oidc {
                  defaultProvider {
                    roleBindings {
                      roleRefs {
                        kind
                        name
                      }
                      subjects {
                        kind
                        name
                      }
                    }
                  }
                  extraProviders {
                    name
                    roleBindings {
                      roleRefs {
                        kind
                        name
                      }
                      subjects {
                        kind
                        name
                      }
                    }
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

// Minimal query — only name + annotations, used for search filtering on collapsed workspaces.
const GET_MCPS_NAMES_QUERY = graphql(`
  query GetMCPsNames($workspaceNamespace: String!) {
    core_openmcp_cloud {
      v1alpha1 {
        ManagedControlPlanes(namespace: $workspaceNamespace) {
          items {
            metadata {
              name
              namespace
              annotations
            }
          }
        }
      }
    }
    core_open_control_plane_io {
      v2alpha1 {
        ControlPlanes(namespace: $workspaceNamespace) {
          items {
            metadata {
              name
              namespace
              annotations
            }
          }
        }
      }
    }
  }
`)

type V1Item = NonNullable<
  NonNullable<GetMcPsListQuery['core_openmcp_cloud']>['v1alpha1']
>['ManagedControlPlanes']['items'][number];
type V2Item = NonNullable<
  NonNullable<GetMcPsListQuery['core_open_control_plane_io']>['v2alpha1']
>['ControlPlanes']['items'][number];

function toV1Input(item: V1Item) {
  return {
    version: 'v1' as const,
    metadata: item.metadata,
    spec: item.spec ? { components: item.spec.components } : null,
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
    spec: item.spec ?? null,
  };
}

const MCP_V1_SUBSCRIPTION = graphql(`
  subscription McpV1Subscription($namespace: String!) {
    core_openmcp_cloud_v1alpha1_managedcontrolplanes(namespace: $namespace) {
      type
    }
  }
`);

const MCP_V2_SUBSCRIPTION = graphql(`
  subscription McpV2Subscription($namespace: String!) {
    core_open_control_plane_io_v2alpha1_controlplanes(namespace: $namespace) {
      type
    }
  }
`);

export function useMcpsQuery(workspaceNamespace?: string, options?: { mode?: McpsQueryMode }) {
  const { enableMcpV2 } = useFeatureToggle();
  const mode = options?.mode ?? 'full';
  const skipAll = !workspaceNamespace || mode === 'skip';

  const queryResult = useQuery(GET_MCPS_LIST_QUERY, {
    variables: { workspaceNamespace: workspaceNamespace ?? '' },
    skip: skipAll || mode !== 'full',
    notifyOnNetworkStatusChange: true,
  });

  const namesResult = useQuery(GET_MCPS_NAMES_QUERY, {
    variables: { workspaceNamespace: workspaceNamespace ?? '' },
    skip: skipAll || mode !== 'minimal',
    notifyOnNetworkStatusChange: true,
  });

  const { refetch } = queryResult;

  // Gate subscriptions on isReadyForSubscriptions to avoid SSE streams exhausting the
  // HTTP/1.1 connection pool before the initial query can get a connection.
  // All workspaces expanding simultaneously would open 16+ SSE streams (8 × 2),
  // blocking GetMCPsList queries for ~30 s until streams timeout.
  const isReadyForSubscriptions = mode === 'full' && queryResult.data !== undefined;

  const { data: v1SubData } = useSubscription(MCP_V1_SUBSCRIPTION, {
    variables: { namespace: workspaceNamespace ?? '' },
    skip: skipAll || mode !== 'full' || !isReadyForSubscriptions,
  });

  const { data: v2SubData } = useSubscription(MCP_V2_SUBSCRIPTION, {
    variables: { namespace: workspaceNamespace ?? '' },
    skip: skipAll || mode !== 'full' || !enableMcpV2 || !isReadyForSubscriptions,
  });

  // Single debounce timer shared by both subscriptions — coalesces burst events from
  // simultaneous v1 + v2 changes into one refetch instead of two.
  const refetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRefetch = useCallback(() => {
    if (refetchTimerRef.current !== null) clearTimeout(refetchTimerRef.current);
    refetchTimerRef.current = setTimeout(() => refetch(), 300);
  }, [refetch]);

  useEffect(() => {
    if (!v1SubData?.core_openmcp_cloud_v1alpha1_managedcontrolplanes) return;
    scheduleRefetch();
  }, [v1SubData, scheduleRefetch]);

  useEffect(() => {
    if (!v2SubData?.core_open_control_plane_io_v2alpha1_controlplanes) return;
    scheduleRefetch();
  }, [v2SubData, scheduleRefetch]);

  const activeData = mode === 'full' ? queryResult.data : namesResult.data;

  // Both queries share the same nested structure; cast to the full type since V1Item/V2Item
  // fields missing from the names query are simply absent at runtime and handled by Zod parsing.
  const typedData = activeData as unknown as typeof queryResult.data;
  const v1Items = typedData?.core_openmcp_cloud?.v1alpha1?.ManagedControlPlanes?.items;
  const v2Items = typedData?.core_open_control_plane_io?.v2alpha1?.ControlPlanes?.items;

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

  const isPending =
    (mode === 'full' && queryResult.loading && queryResult.networkStatus === NetworkStatus.loading) ||
    (mode === 'minimal' && namesResult.loading && namesResult.networkStatus === NetworkStatus.loading);

  const activeError = mode === 'full' ? queryResult.error : namesResult.error;
  return { data: controlPlanes, error: activeError, isPending, isReadyForSubscriptions };
}
