import { useQuery } from '@apollo/client/react';

import { graphql } from '../../../types/__generated__/graphql/index.ts';

const GET_LANDSCAPER_YAML_QUERY = graphql(`
  query GetLandscaperYaml($name: String!, $namespace: String) {
    landscaper_services_open_control_plane_io {
      v1alpha2 {
        LandscaperYaml(name: $name, namespace: $namespace)
      }
    }
  }
`);

export function useLandscaperYamlQuery(name: string, namespace: string, skip = false) {
  const { data, loading, error } = useQuery(GET_LANDSCAPER_YAML_QUERY, {
    variables: { name, namespace },
    skip: skip || !name || !namespace,
    fetchPolicy: 'network-only',
  });

  return {
    yaml: data?.landscaper_services_open_control_plane_io?.v1alpha2?.LandscaperYaml ?? null,
    isLoading: loading,
    error,
  };
}
