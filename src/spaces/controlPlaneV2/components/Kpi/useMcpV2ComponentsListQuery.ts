import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';

import { graphql } from '../../../../types/__generated__/graphql/index.ts';

/**
 * One combined query for every V2 control plane's component-install status in a workspace,
 * replacing what would otherwise be 6 separate per-control-plane queries
 * (`useCrossplaneQuery`/`useFluxQuery`/`useLandscaperQuery`/`useEsoQuery`/`useOcmQuery`/
 * `useKroQuery`) fired once per card in the control-plane grid. All V2 control planes in a
 * workspace share the same `mcpNamespace`, so one list-per-service-per-workspace fetch (instead
 * of one get-per-service-per-card) covers every card — `6` requests total per workspace instead
 * of `6 × cards`. Only `metadata.name` + `spec.version` are selected: that's all `installed`
 * status needs, and it keeps this query cheap even for a workspace with many control planes.
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
          }
        }
      }
    }
  }
`);

export interface McpV2Components {
  crossplane?: true;
  flux?: true;
  landscaper?: true;
  externalSecretsOperator?: true;
  ocm?: true;
  kro?: true;
}

type ListItems =
  | readonly ({ metadata?: { name?: string | null } | null; spec?: { version?: string | null } | null } | null)[]
  | undefined;

function indexByName(items: ListItems, key: keyof McpV2Components, index: Record<string, McpV2Components>) {
  for (const item of items ?? []) {
    const name = item?.metadata?.name;
    if (!name || !item?.spec?.version) continue;
    (index[name] ??= {})[key] = true;
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
