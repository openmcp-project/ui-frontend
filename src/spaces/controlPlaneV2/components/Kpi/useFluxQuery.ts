import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { z } from 'zod';

import { graphql } from '../../../../types/__generated__/graphql/index.ts';
import { FluxData, FluxSchema } from '../../../mcp/types/Flux.ts';
import { useTelemetry } from '../../../../lib/telemetry/telemetry.ts';

const GET_FLUX_QUERY = graphql(`
  query GetFlux($name: String!, $namespace: String) {
    flux_services_open_control_plane_io {
      v1alpha1 {
        Flux(name: $name, namespace: $namespace) {
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

export function useFluxQuery(name?: string, namespace?: string) {
  const telemetry = useTelemetry();
  const queryResult = useQuery(GET_FLUX_QUERY, {
    variables: { name: name ?? '', namespace },
    skip: !name || !namespace,
    notifyOnNetworkStatusChange: true,
  });

  const rawFlux = queryResult.data?.flux_services_open_control_plane_io?.v1alpha1?.Flux;

  const fluxData = useMemo<FluxData | null>(() => {
    if (!rawFlux) return null;
    const result = FluxSchema.safeParse(rawFlux);
    if (!result.success) {
      telemetry.report(result.error, {
        message: 'Invalid Flux data — schema mismatch',
        context: { item: rawFlux, issues: z.treeifyError(result.error) },
      });
      return null;
    }
    const { spec } = result.data;
    const version = spec?.version ?? null;
    return {
      isInstalled: !!version,
      version,
    };
  }, [rawFlux, telemetry]);

  return {
    fluxData,
    isLoading: queryResult.loading,
    error: queryResult.error,
  };
}
