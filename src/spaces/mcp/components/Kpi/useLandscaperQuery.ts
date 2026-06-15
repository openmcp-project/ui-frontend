import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { z } from 'zod';

import { graphql } from '../../../../types/__generated__/graphql/index.ts';
import { LandscaperData, LandscaperSchema } from '../../types/Landscaper.ts';

const GET_LANDSCAPER_QUERY = graphql(`
  query GetLandscaper($name: String!, $namespace: String) {
    landscaper_services_open_control_plane_io {
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
`);

export function useLandscaperQuery(name?: string, namespace?: string) {
  const queryResult = useQuery(GET_LANDSCAPER_QUERY, {
    variables: { name: name ?? '', namespace },
    skip: !name || !namespace,
    notifyOnNetworkStatusChange: true,
  });

  const rawLandscaper = queryResult.data?.landscaper_services_open_control_plane_io?.v1alpha2?.Landscaper;

  const landscaperData = useMemo<LandscaperData | null>(() => {
    if (!rawLandscaper) return null;
    const result = LandscaperSchema.safeParse(rawLandscaper);
    if (!result.success) {
      console.warn('[useLandscaperQuery] Validation failed:', z.treeifyError(result.error));
      return null;
    }
    const { spec } = result.data;
    const version = spec?.version ?? null;
    return {
      isInstalled: !!version,
      version,
    };
  }, [rawLandscaper]);

  return {
    landscaperData,
    isLoading: queryResult.loading,
    error: queryResult.error,
  };
}
