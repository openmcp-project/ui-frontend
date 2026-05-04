import { useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useMemo } from 'react';

const GET_LANDSCAPER_QUERY = gql`
  query GetLandscaper($name: String!, $namespace: String) {
    landscaper_services_openmcp_cloud {
      v1alpha2 {
        Landscaper(name: $name, namespace: $namespace) {
          metadata {
            name
            namespace
          }
          spec {
            version
          }
          status {
            phase
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

export interface UseLandscaperQueryResult {
  landscaperData: {
    isInstalled: boolean;
    version: string | null;
  } | null;
  isLoading: boolean;
  error: unknown | null;
}

export function useLandscaperQuery(name?: string, namespace?: string): UseLandscaperQueryResult {
  const queryResult = useQuery(GET_LANDSCAPER_QUERY, {
    variables: { name: name ?? '', namespace },
    skip: !name || !namespace,
    notifyOnNetworkStatusChange: true,
  });

  const rawLandscaper =
    queryResult.data?.landscaper_services_openmcp_cloud?.v1alpha2?.Landscaper;

  const data = useMemo(() => {
    if (!rawLandscaper) {
      return null;
    }

    return {
      isInstalled: true,
      version: rawLandscaper.spec?.version ?? null,
    };
  }, [rawLandscaper]);

  return {
    landscaperData: data,
    isLoading: queryResult.loading,
    error: queryResult.error,
  };
}
