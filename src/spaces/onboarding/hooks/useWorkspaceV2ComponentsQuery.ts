import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';

import { graphql } from '../../../types/__generated__/graphql/index.ts';

const GET_WORKSPACE_V2_COMPONENTS_QUERY = graphql(`
  query GetWorkspaceV2Components($namespace: String!) {
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
  }
`);

export interface V2ComponentsMap {
  [mcpName: string]: {
    crossplane: boolean;
    flux: boolean;
    landscaper: boolean;
    externalSecretsOperator: boolean;
  };
}

function buildSet(
  items:
    ({ metadata?: { name?: string | null } | null; spec?: { version?: string | null } | null } | null)[] | undefined,
): Set<string> {
  const set = new Set<string>();
  for (const item of items ?? []) {
    if (item?.metadata?.name && item?.spec?.version) {
      set.add(item.metadata.name);
    }
  }
  return set;
}

export function useWorkspaceV2ComponentsQuery(workspaceNamespace?: string) {
  const { data, loading } = useQuery(GET_WORKSPACE_V2_COMPONENTS_QUERY, {
    variables: { namespace: workspaceNamespace ?? '' },
    skip: !workspaceNamespace,
  });

  const componentsMap = useMemo<V2ComponentsMap>(() => {
    const crossplanes = buildSet(data?.crossplane_services_open_control_plane_io?.v1alpha1?.Crossplanes?.items);
    const fluxes = buildSet(data?.flux_services_open_control_plane_io?.v1alpha1?.Fluxes?.items);
    const landscapers = buildSet(data?.landscaper_services_open_control_plane_io?.v1alpha2?.Landscapers?.items);
    const esos = buildSet(
      data?.external_secrets_services_open_control_plane_io?.v1alpha1?.ExternalSecretsOperators?.items,
    );

    const allNames = new Set([...crossplanes, ...fluxes, ...landscapers, ...esos]);
    const map: V2ComponentsMap = {};
    for (const name of allNames) {
      map[name] = {
        crossplane: crossplanes.has(name),
        flux: fluxes.has(name),
        landscaper: landscapers.has(name),
        externalSecretsOperator: esos.has(name),
      };
    }
    return map;
  }, [data]);

  return { componentsMap, isLoading: loading };
}
