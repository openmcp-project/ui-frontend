import { useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useMemo } from 'react';

const GET_CROSSPLANE_QUERY = gql`
  query GetCrossplane($name: String!, $namespace: String) {
    crossplane_services_openmcp_cloud {
      v1alpha1 {
        Crossplane(name: $name, namespace: $namespace) {
          kind
          metadata {
            name
            namespace
          }
          spec {
            providers {
              name
              version
            }
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
`;

export interface CrossplaneProvider {
  name?: string | null;
  version?: string | null;
}

export interface UseCrossplaneQueryResult {
  crossplaneData: {
    isInstalled: boolean;
    providers: CrossplaneProvider[];
  } | null;
  isLoading: boolean;
  error: unknown | null;
}

export function useCrossplaneQuery(name?: string, namespace?: string): UseCrossplaneQueryResult {
  const queryResult = useQuery(GET_CROSSPLANE_QUERY, {
    variables: { name: name ?? '', namespace },
    skip: !name || !namespace,
    notifyOnNetworkStatusChange: true,
  });

  const rawCrossplane = queryResult.data?.crossplane_services_openmcp_cloud?.v1alpha1?.Crossplane;

  const data = useMemo(() => {
    if (!rawCrossplane) {
      return null;
    }

    const providers = rawCrossplane.spec?.providers ?? [];
    console.log('Crossplane providers:', providers);

    return {
      isInstalled: true,
      providers: providers.map((p: CrossplaneProvider) => ({
        name: p?.name ?? null,
        version: p?.version ?? null,
      })),
    };
  }, [rawCrossplane]);

  return {
    crossplaneData: data,
    isLoading: queryResult.loading,
    error: queryResult.error,
  };
}
