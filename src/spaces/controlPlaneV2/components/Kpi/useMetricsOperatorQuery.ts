import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { z } from 'zod';

import { graphql } from '../../../../types/__generated__/graphql/index.ts';
import { MetricsOperatorData, MetricsOperatorSchema } from '../../../mcp/types/MetricsOperator.ts';

const GET_METRICS_OPERATOR_QUERY = graphql(`
  query GetMetricsOperator($name: String!, $namespace: String) {
    metrics_services_open_control_plane_io {
      v1alpha1 {
        MetricsOperator(name: $name, namespace: $namespace) {
          metadata {
            name
            namespace
          }
          spec {
            version
          }
          status {
            conditions {
              type
              status
              reason
              message
            }
          }
        }
      }
    }
  }
`);

export function useMetricsOperatorQuery(name?: string, namespace?: string) {
  const queryResult = useQuery(GET_METRICS_OPERATOR_QUERY, {
    variables: { name: name ?? '', namespace },
    skip: !name || !namespace,
    notifyOnNetworkStatusChange: true,
  });

  const rawMetricsOperator =
    queryResult.data?.metrics_services_open_control_plane_io?.v1alpha1?.MetricsOperator;

  const metricsOperatorData = useMemo<MetricsOperatorData | null>(() => {
    if (!rawMetricsOperator) return null;
    const result = MetricsOperatorSchema.safeParse(rawMetricsOperator);
    if (!result.success) {
      console.warn('[useMetricsOperatorQuery] Validation failed:', z.treeifyError(result.error));
      return null;
    }
    const version = result.data.spec?.version ?? null;
    return { isInstalled: !!version, version };
  }, [rawMetricsOperator]);

  return { metricsOperatorData, isLoading: queryResult.loading, error: queryResult.error };
}
