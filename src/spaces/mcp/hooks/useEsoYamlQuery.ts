import { graphql } from '../../../types/__generated__/graphql';
import { useYamlQuery } from './useYamlQuery.ts';

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
  return useYamlQuery(
    GET_ESO_YAML_QUERY,
    (data) => data.external_secrets_services_open_control_plane_io?.v1alpha1?.ExternalSecretsOperatorYaml,
    name,
    namespace,
    skip,
  );
}
