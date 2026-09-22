import { graphql } from '../../../types/__generated__/graphql';
import { useYamlQuery } from './useYamlQuery.ts';

const GET_METRICS_OPERATOR_YAML_QUERY = graphql(`
  query GetMetricsOperatorYaml($name: String!, $namespace: String) {
    metrics_services_open_control_plane_io {
      v1alpha1 {
        MetricsOperatorYaml(name: $name, namespace: $namespace)
      }
    }
  }
`);

export function useMetricsOperatorYamlQuery(name: string, namespace: string, skip = false) {
  return useYamlQuery(
    GET_METRICS_OPERATOR_YAML_QUERY,
    (data) => data.metrics_services_open_control_plane_io?.v1alpha1?.MetricsOperatorYaml,
    name,
    namespace,
    skip,
  );
}
