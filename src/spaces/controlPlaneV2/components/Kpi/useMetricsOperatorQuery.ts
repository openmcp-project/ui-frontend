import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { z } from 'zod';

import { graphql } from '../../../../types/__generated__/graphql/index.ts';
import { MetricsOperatorData, MetricsOperatorSchema } from '../../../mcp/types/MetricsOperator.ts';
import { useTelemetry } from '../../../../lib/telemetry/telemetry.ts';

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
  const telemetry = useTelemetry();
  const queryResult = useQuery(GET_METRICS_OPERATOR_QUERY, {
    variables: { name: name ?? '', namespace },
    skip: !name || !namespace,
    notifyOnNetworkStatusChange: true,
  });

  const rawMetricsOperator = queryResult.data?.metrics_services_open_control_plane_io?.v1alpha1?.MetricsOperator;

  const metricsOperatorData = useMemo<MetricsOperatorData | null>(() => {
    if (!rawMetricsOperator) return null;
    const result = MetricsOperatorSchema.safeParse(rawMetricsOperator);
    if (!result.success) {
      telemetry.report(result.error, {
        message: 'Invalid MetricsOperator data — schema mismatch',
        context: { issues: z.treeifyError(result.error) },
      });
      return null;
    }
    const version = result.data.spec?.version ?? null;
    return { isInstalled: !!version, version };
  }, [rawMetricsOperator, telemetry]);

  return { metricsOperatorData, isLoading: queryResult.loading, error: queryResult.error };
}
