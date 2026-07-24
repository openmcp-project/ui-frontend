import { graphql } from '../../../types/__generated__/graphql';
import { useYamlQuery } from './useYamlQuery.ts';

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
  return useYamlQuery(
    GET_FLUX_YAML_QUERY,
    (data) => data.flux_services_open_control_plane_io?.v1alpha1?.FluxYaml,
    name,
    namespace,
    skip,
  );
}
