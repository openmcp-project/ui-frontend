import { graphql } from '../../../types/__generated__/graphql';
import { useYamlQuery } from './useYamlQuery.ts';

const GET_KRO_YAML_QUERY = graphql(`
  query GetKroYaml($name: String!, $namespace: String) {
    kro_services_open_control_plane_io {
      v1alpha1 {
        KroYaml(name: $name, namespace: $namespace)
      }
    }
  }
`);

export function useKroYamlQuery(name: string, namespace: string, skip = false) {
  return useYamlQuery(
    GET_KRO_YAML_QUERY,
    (data) => data.kro_services_open_control_plane_io?.v1alpha1?.KroYaml,
    name,
    namespace,
    skip,
  );
}
