import { graphql } from '../../../types/__generated__/graphql';
import { useYamlQuery } from './useYamlQuery.ts';

const GET_OCM_YAML_QUERY = graphql(`
  query GetOcmYaml($name: String!, $namespace: String) {
    ocm_services_open_control_plane_io {
      v1alpha1 {
        OCMYaml(name: $name, namespace: $namespace)
      }
    }
  }
`);

export function useOcmYamlQuery(name: string, namespace: string, skip = false) {
  return useYamlQuery(
    GET_OCM_YAML_QUERY,
    (data) => data.ocm_services_open_control_plane_io?.v1alpha1?.OCMYaml,
    name,
    namespace,
    skip,
  );
}
