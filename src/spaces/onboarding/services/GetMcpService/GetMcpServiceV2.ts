import { NetworkStatus } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

import { ControlPlaneStatusType, ControlPlaneType, ReadyStatus } from '../../../../lib/api/types/crate/controlPlanes';
import { graphql } from '../../../../types/__generated__/graphql';
import { GetMcPv2Query } from '../../../../types/__generated__/graphql/graphql';

const GET_MCP_V2_QUERY = graphql(`
  query GetMCPv2($name: String!, $namespace: String) {
    core_openmcp_cloud {
      v2alpha1 {
        ManagedControlPlaneV2(name: $name, namespace: $namespace) {
          kind
          metadata {
            name
            namespace
            annotations
            creationTimestamp
          }
          spec {
            iam {
              oidc {
                defaultProvider {
                  roleBindings {
                    roleRefs {
                      kind
                      name
                      namespace
                    }
                    subjects {
                      apiGroup
                      kind
                      name
                      namespace
                    }
                  }
                }
                extraProviders {
                  roleBindings {
                    roleRefs {
                      kind
                      name
                      namespace
                    }
                    subjects {
                      apiGroup
                      kind
                      name
                      namespace
                    }
                  }
                }
              }
              tokens {
                name
                permissions {
                  rules {
                    apiGroups
                    resources
                    verbs
                  }
                }
                roleRefs {
                  kind
                  name
                  namespace
                }
              }
            }
          }
          status {
            phase
            access
            observedGeneration
            conditions {
              type
              status
              reason
              message
              lastTransitionTime
            }
          }
        }
      }
    }
  }
`);

type McpV2Item = NonNullable<NonNullable<GetMcPv2Query['core_openmcp_cloud']>['v2alpha1']>['ManagedControlPlaneV2'];
type McpV2Condition = NonNullable<NonNullable<McpV2Item['status']>['conditions']>[number];
type _McpV2DefaultProvider = NonNullable<
  NonNullable<NonNullable<NonNullable<McpV2Item['spec']>['iam']>['oidc']>['defaultProvider']
>;
type RoleBinding = NonNullable<NonNullable<_McpV2DefaultProvider['roleBindings']>[number]>;
type Subject = NonNullable<NonNullable<RoleBinding['subjects']>[number]>;

function parseAccess(accessData: unknown): ControlPlaneStatusType['access'] {
  if (!accessData) return undefined;
  try {
    const parsed = typeof accessData === 'string' ? JSON.parse(accessData) : accessData;
    return {
      key: parsed.key,
      name: parsed.name,
      namespace: parsed.namespace,
      kubeconfig: undefined,
      oidc_openmcp: parsed.oidc_openmcp,
    };
  } catch {
    return undefined;
  }
}

function mapMcpV2Item(item: McpV2Item): ControlPlaneType | undefined {
  if (!item) return undefined;
  const annotations = item.metadata?.annotations;
  const defaultProviderRoleBindings =
    item.spec?.iam?.oidc?.defaultProvider?.roleBindings
      ?.filter((rb): rb is RoleBinding => rb !== null)
      .map((rb) => ({
        role: rb.roleRefs?.find((r) => r !== null)?.name ?? '',
        subjects: (rb.subjects ?? [])
          .filter((s): s is Subject => s !== null)
          .map((s) => ({ kind: s.kind ?? '', name: s.name ?? '' })),
      })) ?? [];
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
    spec: {
      authentication: {},
      iam: {
        oidc: {
          defaultProvider:
            defaultProviderRoleBindings.length > 0 ? { roleBindings: defaultProviderRoleBindings } : null,
        },
      },
    },
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
  const queryResult = useQuery(GET_MCP_V2_QUERY, {
    variables: { name: name ?? '', namespace },
    skip: !name || !namespace,
    notifyOnNetworkStatusChange: true,
  });

  const isPending = queryResult.networkStatus === NetworkStatus.loading;
  const rawItem = queryResult.data?.core_openmcp_cloud?.v2alpha1?.ManagedControlPlaneV2;

  return {
    data: rawItem ? mapMcpV2Item(rawItem) : undefined,
    error: queryResult.error,
    isPending,
  };
}
