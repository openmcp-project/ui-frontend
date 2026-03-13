import { NetworkStatus, gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { TypedDocumentNode, ResultOf, VariablesOf } from '@graphql-typed-document-node/core';

import { ControlPlaneType, ControlPlaneStatusType, ReadyStatus } from '../../../../lib/api/types/crate/controlPlanes';

type RoleRef = {
  kind?: string | null;
  name?: string | null;
  namespace?: string | null;
};

type Subject = {
  apiGroup?: string | null;
  kind?: string | null;
  name?: string | null;
  namespace?: string | null;
};

type RoleBinding = {
  roleRefs?: (RoleRef | null)[] | null;
  subjects?: (Subject | null)[] | null;
};

type Condition = {
  type?: string | null;
  status?: string | null;
  reason?: string | null;
  message?: string | null;
  lastTransitionTime?: string | null;
};

type TokenRule = {
  apiGroups?: (string | null)[] | null;
  resources?: (string | null)[] | null;
  verbs?: (string | null)[] | null;
};

type Token = {
  name?: string | null;
  permissions?: ({ rules?: (TokenRule | null)[] | null } | null)[] | null;
  roleRefs?: (RoleRef | null)[] | null;
};

type GetMcpV2Result = {
  core_openmcp_cloud?: {
    v2alpha1?: {
      ManagedControlPlaneV2: {
        kind?: string | null;
        metadata?: {
          name?: string | null;
          namespace?: string | null;
          annotations?: unknown;
          creationTimestamp?: string | null;
        } | null;
        spec?: {
          iam?: {
            oidc?: {
              defaultProvider?: { roleBindings?: (RoleBinding | null)[] | null } | null;
              extraProviders?: ({ roleBindings?: (RoleBinding | null)[] | null } | null)[] | null;
            } | null;
            tokens?: (Token | null)[] | null;
          } | null;
        } | null;
        status?: {
          phase?: string | null;
          access?: unknown;
          observedGeneration?: number | null;
          conditions?: (Condition | null)[] | null;
        } | null;
      };
    } | null;
  } | null;
};

type GetMcpV2Variables = { name: string; namespace?: string | null };

const GET_MCP_V2_QUERY: TypedDocumentNode<GetMcpV2Result, GetMcpV2Variables> = gql`
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
`;

type GetMcpV2Query = ResultOf<typeof GET_MCP_V2_QUERY>;
type GetMcpV2QueryVariables = VariablesOf<typeof GET_MCP_V2_QUERY>;
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
      oidc_openmcp: parsed.oidc_openmcp,
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
  const queryResult = useQuery<GetMcpV2Query, GetMcpV2QueryVariables>(GET_MCP_V2_QUERY, {
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
