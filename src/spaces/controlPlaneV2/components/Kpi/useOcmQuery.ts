import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { z } from 'zod';

import { OcmData, OcmSchema } from '../../../mcp/types/Ocm.ts';

const GET_OCM_QUERY = gql`
  query GetOCM($name: String!, $namespace: String) {
    ocm_services_open_control_plane_io {
      v1alpha1 {
        OCM(name: $name, namespace: $namespace) {
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
`;

export function useOcmQuery(name?: string, namespace?: string) {
  const queryResult = useQuery(GET_OCM_QUERY, {
    variables: { name: name ?? '', namespace },
    skip: !name || !namespace,
    notifyOnNetworkStatusChange: true,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawOcm = (queryResult.data as any)?.ocm_services_open_control_plane_io?.v1alpha1?.OCM;

  const ocmData = useMemo<OcmData | null>(() => {
    if (!rawOcm) return null;
    const result = OcmSchema.safeParse(rawOcm);
    if (!result.success) {
      console.warn('[useOcmQuery] Validation failed:', z.treeifyError(result.error));
      return null;
    }
    const version = result.data.spec?.version ?? null;
    return { isInstalled: !!version, version };
  }, [rawOcm]);

  return { ocmData, isLoading: queryResult.loading, error: queryResult.error };
}
