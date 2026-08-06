import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { z } from 'zod';

import { graphql } from '../../../../types/__generated__/graphql/index.ts';
import { KroData, KroSchema } from '../../../mcp/types/Kro.ts';

const GET_KRO_QUERY = graphql(`
  query GetKRO($name: String!, $namespace: String) {
    kro_services_open_control_plane_io {
      v1alpha1 {
        Kro(name: $name, namespace: $namespace) {
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

export function useKroQuery(name?: string, namespace?: string) {
  const queryResult = useQuery(GET_KRO_QUERY, {
    variables: { name: name ?? '', namespace },
    skip: !name || !namespace,
    notifyOnNetworkStatusChange: true,
  });

  const rawKro = queryResult.data?.kro_services_open_control_plane_io?.v1alpha1?.Kro;

  const kroData = useMemo<KroData | null>(() => {
    if (!rawKro) return null;
    const result = KroSchema.safeParse(rawKro);
    if (!result.success) {
      console.warn('[useKroQuery] Validation failed:', z.treeifyError(result.error));
      return null;
    }
    const version = result.data.spec?.version ?? null;
    return { isInstalled: !!version, version };
  }, [rawKro]);

  return { kroData, isLoading: queryResult.loading, error: queryResult.error };
}
