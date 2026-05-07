import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { graphql } from '../../../../types/__generated__/graphql/index.ts';

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

export interface UseFluxQueryResult {
  fluxData: {
    isInstalled: boolean;
    version: string | null;
  } | null;
  isLoading: boolean;
  error: unknown | null;
}

export function useFluxQuery(name?: string, namespace?: string): UseFluxQueryResult {
  const queryResult = useQuery(GET_FLUX_QUERY, {
    variables: { name: name ?? '', namespace },
    skip: !name || !namespace,
    notifyOnNetworkStatusChange: true,
  });

  const rawFlux = queryResult.data?.flux_services_openmcp_cloud?.v1alpha1?.Flux;

  const data = useMemo(() => {
    if (!rawFlux) {
      return null;
    }

    return {
      isInstalled: true,
      version: rawFlux.spec?.version ?? null,
    };
  }, [rawFlux]);

  return {
    fluxData: data,
    isLoading: queryResult.loading,
    error: queryResult.error,
  };
}
