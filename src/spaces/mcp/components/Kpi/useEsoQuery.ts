import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { z } from 'zod';

import { graphql } from '../../../../types/__generated__/graphql/index.ts';
import { EsoData, EsoSchema } from '../../types/Eso.ts';

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

export function useEsoQuery(name?: string, namespace?: string) {
  const queryResult = useQuery(GET_ESO_QUERY, {
    variables: { name: name ?? '', namespace },
    skip: !name || !namespace,
    notifyOnNetworkStatusChange: true,
  });

  const rawEso = queryResult.data?.external_secrets_services_openmcp_cloud?.v1alpha1?.ExternalSecretsOperator;

  const esoData = useMemo<EsoData | null>(() => {
    if (!rawEso) return null;
    const result = EsoSchema.safeParse(rawEso);
    if (!result.success) {
      console.warn('[useEsoQuery] Validation failed:', z.treeifyError(result.error));
      return null;
    }
    const { spec } = result.data;
    const version = spec?.version ?? null;
    return {
      isInstalled: !!version,
      version,
    };
  }, [rawEso]);

  return {
    esoData,
    isLoading: queryResult.loading,
    error: queryResult.error,
  };
}
