import { useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import type { ErrorLike } from '@apollo/client';

import { graphql } from '../../../types/__generated__/graphql';
import type { GetManagedControlPlaneForEditQuery } from '../../../types/__generated__/graphql/graphql';
import type {
  ManagedControlPlaneInterface,
  MCPComponentsSpec,
  MCPRoleBinding,
} from '../../../lib/api/types/mcpResource';

/**
 * Full ManagedControlPlane (v1) fetch for the edit/duplicate wizard — the GraphQL replacement
 * for the crate-scoped REST `ResourceObject<ManagedControlPlaneInterface>(...)` fetch used by
 * `EditManagedControlPlaneWizardDataLoader`. Unlike `useManagedControlPlaneQuery` (which only
 * needs component *presence* for display), the wizard needs full component config (versions,
 * providers, deployers) plus labels/annotations to prefill the form.
 */
const GET_MCP_V1_FOR_EDIT_QUERY = graphql(`
  query GetManagedControlPlaneForEdit($name: String!, $namespace: String!) {
    core_openmcp_cloud {
      v1alpha1 {
        ManagedControlPlane(name: $name, namespace: $namespace) {
          metadata {
            uid
            name
            namespace
            labels
            annotations
          }
          spec {
            authorization {
              roleBindings {
                role
                subjects {
                  kind
                  name
                  namespace
                }
              }
            }
            components {
              apiServer {
                type
              }
              crossplane {
                version
                providers {
                  name
                  version
                }
              }
              flux {
                version
              }
              externalSecretsOperator {
                version
              }
              btpServiceOperator {
                version
              }
              kyverno {
                version
              }
              landscaper {
                deployers
              }
            }
          }
        }
      }
    }
  }
`);

type RawManagedControlPlane = NonNullable<
  NonNullable<GetManagedControlPlaneForEditQuery['core_openmcp_cloud']>['v1alpha1']
>['ManagedControlPlane'];

function mapToManagedControlPlane(raw: RawManagedControlPlane | undefined): ManagedControlPlaneInterface | undefined {
  if (!raw?.metadata?.name) return undefined;

  const roleBindings: MCPRoleBinding[] = (raw.spec?.authorization?.roleBindings ?? []).flatMap((rb) => {
    if (!rb?.role) return [];
    return [
      {
        role: rb.role,
        subjects: (rb.subjects ?? []).flatMap((s) =>
          s?.name && s?.kind ? [{ kind: s.kind, name: s.name, namespace: s.namespace ?? undefined }] : [],
        ),
      },
    ];
  });

  const rawComponents = raw.spec?.components;
  const components: MCPComponentsSpec = {};
  if (rawComponents?.apiServer) {
    components.apiServer = { type: rawComponents.apiServer.type ?? undefined };
  }
  if (rawComponents?.crossplane) {
    components.crossplane = {
      version: rawComponents.crossplane.version ?? undefined,
      providers: (rawComponents.crossplane.providers ?? []).flatMap((p) =>
        p?.name ? [{ name: p.name, version: p.version ?? undefined }] : [],
      ),
    };
  }
  if (rawComponents?.flux) {
    components.flux = { version: rawComponents.flux.version ?? undefined };
  }
  if (rawComponents?.externalSecretsOperator) {
    components.externalSecretsOperator = { version: rawComponents.externalSecretsOperator.version ?? undefined };
  }
  if (rawComponents?.landscaper) {
    components.landscaper = { deployers: (rawComponents.landscaper.deployers ?? []).filter((d) => !!d) as string[] };
  }
  // btpServiceOperator / kyverno aren't in MCPComponentsSpec's typed fields but are read
  // generically downstream via Object.keys(...) — attach them the same way REST did.
  if (rawComponents?.btpServiceOperator) {
    (components as Record<string, unknown>).btpServiceOperator = {
      version: rawComponents.btpServiceOperator.version ?? undefined,
    };
  }
  if (rawComponents?.kyverno) {
    (components as Record<string, unknown>).kyverno = { version: rawComponents.kyverno.version ?? undefined };
  }

  return {
    apiVersion: 'core.openmcp.cloud/v1alpha1',
    kind: 'ManagedControlPlane',
    metadata: {
      name: raw.metadata.name,
      namespace: raw.metadata.namespace ?? undefined,
      labels: (raw.metadata.labels as Record<string, string>) ?? undefined,
      annotations: (raw.metadata.annotations as Record<string, string>) ?? undefined,
    },
    spec: {
      authorization: { roleBindings },
      components,
    },
  };
}

export function useManagedControlPlaneEditQuery(namespace?: string, name?: string, disable?: boolean) {
  const skip = !!disable || !namespace || !name;

  const { data, loading, error } = useQuery(GET_MCP_V1_FOR_EDIT_QUERY, {
    variables: { name: name ?? '', namespace: namespace ?? '' },
    skip,
    fetchPolicy: 'cache-and-network',
  });

  const raw = data?.core_openmcp_cloud?.v1alpha1?.ManagedControlPlane;
  const mapped = useMemo(() => mapToManagedControlPlane(raw), [raw]);

  return {
    data: mapped,
    error: error as ErrorLike | undefined,
    isLoading: loading,
  };
}
