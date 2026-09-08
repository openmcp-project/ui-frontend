import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { z } from 'zod';

import { graphql } from '../../../../types/__generated__/graphql/index.ts';
import { OcmData, OcmSchema } from '../../../mcp/types/Ocm.ts';
import { useTelemetry } from '../../../../lib/telemetry/telemetry.ts';

const GET_OCM_QUERY = graphql(`
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
`);

export function useOcmQuery(name?: string, namespace?: string) {
  const telemetry = useTelemetry();
  const queryResult = useQuery(GET_OCM_QUERY, {
    variables: { name: name ?? '', namespace },
    skip: !name || !namespace,
    notifyOnNetworkStatusChange: true,
  });

  const rawOcm = queryResult.data?.ocm_services_open_control_plane_io?.v1alpha1?.OCM;

  const ocmData = useMemo<OcmData | null>(() => {
    if (!rawOcm) return null;
    const result = OcmSchema.safeParse(rawOcm);
    if (!result.success) {
      telemetry.report(result.error, {
        message: 'Invalid OCM data — schema mismatch',
        context: { item: rawOcm, issues: z.treeifyError(result.error) },
      });
      return null;
    }
    const version = result.data.spec?.version ?? null;
    return { isInstalled: !!version, version };
  }, [rawOcm, telemetry]);

  return { ocmData, isLoading: queryResult.loading, error: queryResult.error };
}
