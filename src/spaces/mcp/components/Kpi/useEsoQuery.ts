import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { graphql } from '../../../../types/__generated__/graphql/index.ts';

const GET_ESO_QUERY = graphql(`
  query GetExternalSecretsOperator($name: String!, $namespace: String) {
    external_secrets_services_openmcp_cloud {
      v1alpha1 {
        ExternalSecretsOperator(name: $name, namespace: $namespace) {
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

export interface UseEsoQueryResult {
  esoData: {
    isInstalled: boolean;
    version: string | null;
  } | null;
  isLoading: boolean;
  error: unknown | null;
}

export function useEsoQuery(name?: string, namespace?: string): UseEsoQueryResult {
  const queryResult = useQuery(GET_ESO_QUERY, {
    variables: { name: name ?? '', namespace },
    skip: !name || !namespace,
    notifyOnNetworkStatusChange: true,
  });

  const rawEso = queryResult.data?.external_secrets_services_openmcp_cloud?.v1alpha1?.ExternalSecretsOperator;

  const data = useMemo(() => {
    if (!rawEso) {
      return null;
    }

    return {
      isInstalled: true,
      version: rawEso.spec?.version ?? null,
    };
  }, [rawEso]);

  return {
    esoData: data,
    isLoading: queryResult.loading,
    error: queryResult.error,
  };
}
