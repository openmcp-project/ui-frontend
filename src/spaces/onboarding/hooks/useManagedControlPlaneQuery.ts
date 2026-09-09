import { useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import type { ErrorLike } from '@apollo/client';

import { graphql } from '../../../types/__generated__/graphql';
import type { GetManagedControlPlaneQuery } from '../../../types/__generated__/graphql/graphql';
import type {
  ControlPlaneType,
  ControlPlaneComponentsType,
  ControlPlaneStatusType,
} from '../../../lib/api/types/crate/controlPlanes';
import { flattenV1RoleBindings } from '../types/ControlPlane.ts';

/**
 * Single ManagedControlPlane (v1) fetch — the GraphQL replacement for the crate-scoped REST
 * `ControlPlane(...)` resource (V2 equivalent: `useControlPlaneV2Query`). The selection mirrors
 * the fields the old REST `jq` extracted and flattens `status.components.authentication.access`
 * to `status.access` as the jq did, so consumers keep the same `ControlPlaneType` shape.
 */
const GET_MCP_V1_QUERY = graphql(`
  query GetManagedControlPlane($name: String!, $namespace: String!) {
    core_openmcp_cloud {
      v1alpha1 {
        ManagedControlPlane(name: $name, namespace: $namespace) {
          metadata {
            uid
            name
            namespace
            creationTimestamp
            annotations
          }
          spec {
            components {
              crossplane {
                __typename
                version
              }
              flux {
                __typename
                version
              }
              landscaper {
                __typename
              }
              kyverno {
                __typename
                version
              }
              externalSecretsOperator {
                __typename
                version
              }
              btpServiceOperator {
                __typename
                version
              }
            }
            authorization {
              roleBindings {
                role
                subjects {
                  kind
                  name
                }
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
`);

type RawManagedControlPlane = NonNullable<
  NonNullable<GetManagedControlPlaneQuery['core_openmcp_cloud']>['v1alpha1']
>['ManagedControlPlane'];

function mapToControlPlaneType(raw: RawManagedControlPlane | undefined): ControlPlaneType | undefined {
  if (!raw) return undefined;

  const roleBindings = flattenV1RoleBindings(raw.spec?.authorization?.roleBindings);

  const access = raw.status?.components?.authentication?.access;

  const status: ControlPlaneStatusType | undefined = raw.status
    ? {
        status: raw.status.status ?? '',
        conditions: (raw.status.conditions ?? []).flatMap((c) =>
          c
            ? [
                {
                  type: c.type ?? '',
                  status: c.status ?? '',
                  reason: c.reason ?? '',
                  message: c.message ?? '',
                  lastTransitionTime: c.lastTransitionTime ?? '',
                },
              ]
            : [],
        ),
        access: access
          ? {
              key: access.key ?? undefined,
              name: access.name ?? undefined,
              namespace: access.namespace ?? undefined,
              kubeconfig: undefined,
              oidc_openmcp: undefined,
            }
          : undefined,
      }
    : undefined;

  return {
    metadata: {
      name: raw.metadata?.name ?? '',
      namespace: raw.metadata?.namespace ?? '',
      creationTimestamp: raw.metadata?.creationTimestamp ?? '',
      annotations: (raw.metadata?.annotations as ControlPlaneType['metadata']['annotations']) ?? undefined,
    },
    // Presence (`__typename`) and `version` are read downstream; landscaper has no `version`
    // field in the schema, hence its narrower selection above.
    spec: {
      authentication: { enableSystemIdentityProvider: undefined },
      components: (raw.spec?.components as ControlPlaneComponentsType | undefined) ?? undefined,
      authorization: { roleBindings },
    },
    status,
  };
}

export function useManagedControlPlaneQuery(
  projectName?: string,
  workspaceName?: string,
  controlPlaneName?: string,
  disable?: boolean,
) {
  const namespace = `project-${projectName}--ws-${workspaceName}`;
  const skip = !!disable || !projectName || !workspaceName || !controlPlaneName;

  const { data, loading, error } = useQuery(GET_MCP_V1_QUERY, {
    variables: { name: controlPlaneName ?? '', namespace },
    skip,
    fetchPolicy: 'cache-and-network',
  });

  const raw = data?.core_openmcp_cloud?.v1alpha1?.ManagedControlPlane;
  const mapped = useMemo(() => mapToControlPlaneType(raw), [raw]);

  return {
    data: mapped,
    error: error as ErrorLike | undefined,
    isLoading: loading,
  };
}
