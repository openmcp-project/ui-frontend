import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';

import { graphql } from '../../../../types/__generated__/graphql/index.ts';

/**
 * One combined query for every V2 control plane's component-install status in a workspace,
 * replacing 6 per-control-plane queries fired once per card. All V2 control planes in a workspace
 * share the same `mcpNamespace`, so this is 6 requests per workspace instead of 6 × cards.
 * `metadata.name` + `spec.version` drive `installed` status; `status.phase` drives the per-service
 * lifecycle indicator (installing / deleting) shown on the control plane card.
 */
const GET_MCP_V2_COMPONENTS_LIST_QUERY = graphql(`
  query GetMcpV2ComponentsList($namespace: String) {
    crossplane_services_open_control_plane_io {
      v1alpha1 {
        Crossplanes(namespace: $namespace) {
          items {
            metadata {
              name
            }
            spec {
              version
            }
            status {
              phase
            }
          }
        }
      }
    }
    flux_services_open_control_plane_io {
      v1alpha1 {
        Fluxes(namespace: $namespace) {
          items {
            metadata {
              name
            }
            spec {
              version
            }
            status {
              phase
            }
          }
        }
      }
    }
    landscaper_services_open_control_plane_io {
      v1alpha2 {
        Landscapers(namespace: $namespace) {
          items {
            metadata {
              name
            }
            spec {
              version
            }
            status {
              phase
            }
          }
        }
      }
    }
    external_secrets_services_open_control_plane_io {
      v1alpha1 {
        ExternalSecretsOperators(namespace: $namespace) {
          items {
            metadata {
              name
            }
            spec {
              version
            }
            status {
              phase
            }
          }
        }
      }
    }
    ocm_services_open_control_plane_io {
      v1alpha1 {
        OCMs(namespace: $namespace) {
          items {
            metadata {
              name
            }
            spec {
              version
            }
            status {
              phase
            }
          }
        }
      }
    }
    kro_services_open_control_plane_io {
      v1alpha1 {
        Kroes(namespace: $namespace) {
          items {
            metadata {
              name
            }
            spec {
              version
            }
            status {
              phase
            }
          }
        }
      }
    }
  }
`);

export interface McpV2ComponentStatus {
  /** Raw `status.phase` reported by the service resource (e.g. `Progressing`, `Terminating`, `Ready`). */
  phase?: string | null;
}

export interface McpV2Components {
  crossplane?: McpV2ComponentStatus;
  flux?: McpV2ComponentStatus;
  landscaper?: McpV2ComponentStatus;
  externalSecretsOperator?: McpV2ComponentStatus;
  ocm?: McpV2ComponentStatus;
  kro?: McpV2ComponentStatus;
}

type ListItems =
  | readonly ({
      metadata?: { name?: string | null } | null;
      spec?: { version?: string | null } | null;
      status?: { phase?: string | null } | null;
    } | null)[]
  | undefined;

function indexByName(items: ListItems, key: keyof McpV2Components, index: Record<string, McpV2Components>) {
  for (const item of items ?? []) {
    const name = item?.metadata?.name;
    if (!name || !item?.spec?.version) continue;
    (index[name] ??= {})[key] = { phase: item.status?.phase ?? null };
  }
}

/** `namespace` here is the workspace's `mcpNamespace` (`project-x--ws-y`), shared by every V2 control plane in it. */
export function useMcpV2ComponentsListQuery(namespace?: string, skip = false) {
  const queryResult = useQuery(GET_MCP_V2_COMPONENTS_LIST_QUERY, {
    variables: { namespace },
    skip: skip || !namespace,
    notifyOnNetworkStatusChange: true,
  });

  const componentsByName = useMemo<Record<string, McpV2Components>>(() => {
    const data = queryResult.data;
    const index: Record<string, McpV2Components> = {};
    indexByName(data?.crossplane_services_open_control_plane_io?.v1alpha1?.Crossplanes?.items, 'crossplane', index);
    indexByName(data?.flux_services_open_control_plane_io?.v1alpha1?.Fluxes?.items, 'flux', index);
    indexByName(data?.landscaper_services_open_control_plane_io?.v1alpha2?.Landscapers?.items, 'landscaper', index);
    indexByName(
      data?.external_secrets_services_open_control_plane_io?.v1alpha1?.ExternalSecretsOperators?.items,
      'externalSecretsOperator',
      index,
    );
    indexByName(data?.ocm_services_open_control_plane_io?.v1alpha1?.OCMs?.items, 'ocm', index);
    indexByName(data?.kro_services_open_control_plane_io?.v1alpha1?.Kroes?.items, 'kro', index);
    return index;
  }, [queryResult.data]);

  return {
    componentsByName,
    isLoading: queryResult.loading,
    error: queryResult.error,
  };
}
