import { NetworkStatus } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';

import { z } from 'zod';

import { graphql } from '../../../../types/__generated__/graphql';
import { ManagedControlPlaneV2, ManagedControlPlaneV2Schema } from '../../types/ControlPlane.ts';
import { useTelemetry } from '../../../../lib/telemetry/telemetry.ts';

export const GET_MCP_V2_QUERY = graphql(`
  query GetMCPv2($name: String!, $namespace: String) {
    core_open_control_plane_io {
      v2alpha1 {
        ControlPlane(name: $name, namespace: $namespace) {
          kind
          metadata {
            uid
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
                  name
                  issuer
                  clientID
                  usernameClaim
                  usernamePrefix
                  groupsClaim
                  groupsPrefix
                  extraScopes
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

export function useControlPlaneV2Query(name?: string, namespace?: string) {
  const telemetry = useTelemetry();
  const queryResult = useQuery(GET_MCP_V2_QUERY, {
    variables: { name: name ?? '', namespace },
    skip: !name || !namespace,
    notifyOnNetworkStatusChange: true,
  });

  const isPending = queryResult.networkStatus === NetworkStatus.loading;
  const rawItem = queryResult.data?.core_open_control_plane_io?.v2alpha1?.ControlPlane;

  const data = useMemo<ManagedControlPlaneV2 | undefined>(() => {
    if (!rawItem) return undefined;
    const result = ManagedControlPlaneV2Schema.safeParse(rawItem);
    if (!result.success) {
      telemetry.report(result.error, {
        message: 'Invalid ManagedControlPlaneV2 data — schema mismatch',
        context: { item: rawItem, issues: z.treeifyError(result.error) },
      });
      return undefined;
    }
    return result.data;
  }, [rawItem, telemetry]);

  return {
    data,
    error: queryResult.error,
    isPending,
  };
}
