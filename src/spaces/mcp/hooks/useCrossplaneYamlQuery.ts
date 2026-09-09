import { graphql } from '../../../types/__generated__/graphql';
import { useYamlQuery } from './useYamlQuery.ts';

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
  return useYamlQuery(
    GET_CROSSPLANE_YAML_QUERY,
    (data) => data.crossplane_services_open_control_plane_io?.v1alpha1?.CrossplaneYaml,
    name,
    namespace,
    skip,
  );
}
