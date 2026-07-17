import { useQuery } from '@apollo/client/react';

import { graphql } from '../../../types/__generated__/graphql';

const GET_CROSSPLANE_YAML_QUERY = graphql(`
  query GetCrossplaneYaml($name: String!, $namespace: String) {
    crossplane_services_open_control_plane_io {
      v1alpha1 {
        CrossplaneYaml(name: $name, namespace: $namespace)
      }
    }
  }
`);

export function useCrossplaneYamlQuery(name: string, namespace: string, skip = false) {
  const { data, loading, error } = useQuery(GET_CROSSPLANE_YAML_QUERY, {
    variables: { name, namespace },
    skip: skip || !name || !namespace,
    fetchPolicy: 'network-only',
    pollInterval: 30_000,
  });

  return {
    yaml: data?.crossplane_services_open_control_plane_io?.v1alpha1?.CrossplaneYaml ?? null,
    isLoading: loading,
    error,
  };
}
