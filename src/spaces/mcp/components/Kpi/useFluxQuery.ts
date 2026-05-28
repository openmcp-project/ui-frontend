import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { z } from 'zod';

import { graphql } from '../../../../types/__generated__/graphql/index.ts';
import { FluxData, FluxSchema } from '../../types/Flux.ts';

const GET_FLUX_QUERY = graphql(`
  query GetFlux($name: String!, $namespace: String) {
    flux_services_openmcp_cloud {
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
  const queryResult = useQuery(GET_FLUX_QUERY, {
    variables: { name: name ?? '', namespace },
    skip: !name || !namespace,
    notifyOnNetworkStatusChange: true,
  });

  const rawFlux = queryResult.data?.flux_services_openmcp_cloud?.v1alpha1?.Flux;

  const fluxData = useMemo<FluxData | null>(() => {
    if (!rawFlux) return null;
    const result = FluxSchema.safeParse(rawFlux);
    if (!result.success) {
      console.warn('[useFluxQuery] Validation failed:', z.treeifyError(result.error));
      return null;
    }
    const { spec } = result.data;
    const version = spec?.version ?? null;
    return {
      isInstalled: !!version,
      version,
    };
  }, [rawFlux]);

  return {
    fluxData,
    isLoading: queryResult.loading,
    error: queryResult.error,
  };
}
