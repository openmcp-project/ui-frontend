import { useQuery } from '@apollo/client/react';

import { graphql } from '../../../types/__generated__/graphql/index.ts';

const GET_FLUX_YAML_QUERY = graphql(`
  query GetFluxYaml($name: String!, $namespace: String) {
    flux_services_open_control_plane_io {
      v1alpha1 {
        FluxYaml(name: $name, namespace: $namespace)
      }
    }
  }
`);

export function useFluxYamlQuery(name: string, namespace: string, skip = false) {
  const { data, loading, error } = useQuery(GET_FLUX_YAML_QUERY, {
    variables: { name, namespace },
    skip: skip || !name || !namespace,
    fetchPolicy: 'network-only',
  });

  return {
    yaml: data?.flux_services_open_control_plane_io?.v1alpha1?.FluxYaml ?? null,
    isLoading: loading,
    error,
  };
}
