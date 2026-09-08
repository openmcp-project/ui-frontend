import { graphql } from '../../../types/__generated__/graphql';
import { useYamlQuery } from './useYamlQuery.ts';

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
  return useYamlQuery(
    GET_LANDSCAPER_YAML_QUERY,
    (data) => data.landscaper_services_open_control_plane_io?.v1alpha2?.LandscaperYaml,
    name,
    namespace,
    skip,
  );
}
