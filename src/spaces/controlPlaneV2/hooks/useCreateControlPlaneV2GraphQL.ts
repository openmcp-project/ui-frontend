import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { z } from 'zod';
import { buildMcpV2GraphQLInput } from '../helpers/controlPlaneV2GraphQLInput.ts';
import { McpV2Input, McpV2InputSchema } from '../../mcp/schemas/mcpV2Input.schema.ts';
import { useTelemetry } from '../../../lib/telemetry/telemetry.ts';
import { CreateManagedControlPlaneV2Mutation } from './useCreateControlPlaneV2Mutation.ts';

export function useCreateControlPlaneV2GraphQL() {
  const [createMutation, { loading, error }] = useMutation(CreateManagedControlPlaneV2Mutation, {
    refetchQueries: ['GetMCPsList'],
  });
  const telemetry = useTelemetry();

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
      });

      const created = result.data?.core_open_control_plane_io?.v2alpha1?.createControlPlane;
      if (!created) {
        throw new Error('ManagedControlPlaneV2 creation returned no data');
      }

      return created;
    },
    [createMutation, telemetry],
  );

  return { createMcp, loading, error };
}
