import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { z } from 'zod';
import { graphql } from '../../../types/__generated__/graphql';
import { buildMcpV2GraphQLInput } from '../helpers/controlPlaneV2GraphQLInput.ts';
import { McpV2Input, McpV2InputSchema } from '../../mcp/schemas/mcpV2Input.schema.ts';
import { useTelemetry } from '../../../lib/telemetry/telemetry.ts';
import { useAccessDeniedFeedback } from '../../../lib/api/access/useAccessDeniedFeedback.ts';

export const CreateManagedControlPlaneV2Mutation = graphql(`
  mutation CreateManagedControlPlaneV2(
    $namespace: String
    $object: CoreOpenControlPlaneIoV2alpha1ControlPlane_Input!
    $dryRun: Boolean
  ) {
    core_open_control_plane_io {
      v2alpha1 {
        createControlPlane(namespace: $namespace, object: $object, dryRun: $dryRun) {
          metadata {
            uid
            name
            namespace
          }
          status {
            phase
          }
        }
      }
    }
  }
`);

export function useCreateControlPlaneV2GraphQL() {
  const [createMutation, { loading, error }] = useMutation(CreateManagedControlPlaneV2Mutation, {
    refetchQueries: ['GetMCPsList'],
  });
  const telemetry = useTelemetry();
  const recordDenied = useAccessDeniedFeedback();

  const createMcp = useCallback(
    async (rawInput: McpV2Input) => {
      const parsed = McpV2InputSchema.safeParse(rawInput);
      if (!parsed.success) {
        telemetry.report(parsed.error, {
          message: 'Invalid ManagedControlPlaneV2 input — schema mismatch',
          context: { issues: z.treeifyError(parsed.error) },
        });
        throw new Error('Invalid ManagedControlPlaneV2 input');
      }

      const object = buildMcpV2GraphQLInput(parsed.data);

      const result = await createMutation({
        variables: {
          namespace: parsed.data.namespace,
          object,
        },
      }).catch((error: unknown) => {
        recordDenied(error, {
          verb: 'create',
          group: 'core.open-control-plane.io',
          resource: 'controlplanes',
          namespace: parsed.data.namespace,
        });
        throw error;
      });

      const created = result.data?.core_open_control_plane_io?.v2alpha1?.createControlPlane;
      if (!created) {
        throw new Error('ManagedControlPlaneV2 creation returned no data');
      }

      return created;
    },
    [createMutation, telemetry, recordDenied],
  );

  return { createMcp, loading, error };
}
