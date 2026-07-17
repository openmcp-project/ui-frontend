import { useQuery } from '@apollo/client/react';

import { graphql } from '../../../types/__generated__/graphql/index.ts';

const GET_ESO_YAML_QUERY = graphql(`
  query GetEsoYaml($name: String!, $namespace: String) {
    external_secrets_services_open_control_plane_io {
      v1alpha1 {
        ExternalSecretsOperatorYaml(name: $name, namespace: $namespace)
      }
    }
  }
`);

export function useEsoYamlQuery(name: string, namespace: string, skip = false) {
  const { data, loading, error } = useQuery(GET_ESO_YAML_QUERY, {
    variables: { name, namespace },
    skip: skip || !name || !namespace,
    fetchPolicy: 'network-only',
    pollInterval: 30_000,
  });

  return {
    yaml: data?.external_secrets_services_open_control_plane_io?.v1alpha1?.ExternalSecretsOperatorYaml ?? null,
    isLoading: loading,
    error,
  };
}
