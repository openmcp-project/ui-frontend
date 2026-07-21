import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { z } from 'zod';

import { graphql } from '../../../../types/__generated__/graphql/index.ts';
import { CrossplaneData, CrossplaneSchema } from '../../../mcp/types/Crossplane.ts';

const GET_CROSSPLANE_QUERY = graphql(`
  query GetCrossplane($name: String!, $namespace: String) {
    crossplane_services_open_control_plane_io {
      v1alpha1 {
        Crossplane(name: $name, namespace: $namespace) {
          kind
          metadata {
            name
            namespace
          }
          spec {
            version
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
`);

export function useCrossplaneQuery(name?: string, namespace?: string) {
  const queryResult = useQuery(GET_CROSSPLANE_QUERY, {
    variables: { name: name ?? '', namespace },
    skip: !name || !namespace,
    notifyOnNetworkStatusChange: true,
  });

  const rawCrossplane = queryResult.data?.crossplane_services_open_control_plane_io?.v1alpha1?.Crossplane;

  const crossplaneData = useMemo<CrossplaneData | null>(() => {
    if (!rawCrossplane) return null;
    const result = CrossplaneSchema.safeParse(rawCrossplane);
    if (!result.success) {
      console.warn('[useCrossplaneQuery] Validation failed:', z.treeifyError(result.error));
      return null;
    }
    const { spec } = result.data;
    const version = spec?.version ?? null;
    return {
      isInstalled: !!version,
      version,
      providers: (spec?.providers ?? []).flatMap((p) =>
        p ? [{ name: p.name ?? null, version: p.version ?? null }] : [],
      ),
    };
  }, [rawCrossplane]);

  return {
    crossplaneData,
    isLoading: queryResult.loading,
    error: queryResult.error,
  };
}
