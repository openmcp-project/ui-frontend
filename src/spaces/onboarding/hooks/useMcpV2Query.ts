import { NetworkStatus } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';

import { z } from 'zod';

import { graphql } from '../../../types/__generated__/graphql';
import { ManagedControlPlaneV2, ManagedControlPlaneV2Schema } from '../types/ControlPlane';

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

export function useMcpV2Query(name?: string, namespace?: string) {
  const queryResult = useQuery(GET_MCP_V2_QUERY, {
    variables: { name: name ?? '', namespace },
    skip: !name || !namespace,
    notifyOnNetworkStatusChange: true,
  });

  const isPending = queryResult.networkStatus === NetworkStatus.loading;
  const rawItem = queryResult.data?.core_openmcp_cloud?.v2alpha1?.ManagedControlPlaneV2;

  const data = useMemo<ManagedControlPlaneV2 | undefined>(() => {
    if (!rawItem) return undefined;
    const result = ManagedControlPlaneV2Schema.safeParse(rawItem);
    if (!result.success) {
      console.warn('[useMcpV2Query] Validation failed:', z.treeifyError(result.error));
      return undefined;
    }
    return result.data;
  }, [rawItem]);

  return {
    data,
    error: queryResult.error,
    isPending,
  };
}
