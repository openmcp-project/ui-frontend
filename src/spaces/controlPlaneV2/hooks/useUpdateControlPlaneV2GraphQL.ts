import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { z } from 'zod';
import { buildMcpV2GraphQLInput } from '../helpers/controlPlaneV2GraphQLInput.ts';
import { McpV2Input, McpV2InputSchema } from '../../mcp/schemas/mcpV2Input.schema.ts';
import { UpdateManagedControlPlaneV2Mutation } from './useUpdateControlPlaneV2Mutation.ts';
import { useTelemetry } from '../../../lib/telemetry/telemetry.ts';

export function useUpdateControlPlaneV2GraphQL() {
  const telemetry = useTelemetry();
  const [updateMutation, { loading, error }] = useMutation(UpdateManagedControlPlaneV2Mutation, {
    // The response only selects `metadata`/`status.phase`, not the updated `spec`, so spec changes
    // (role bindings, IAM config) won't reach other open views without a refetch — as in the
    // sibling create/delete hooks.
    refetchQueries: ['GetMCPsList', 'GetMCPv2'],
  });

  const updateMcp = useCallback(
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

      const result = await updateMutation({
        variables: {
          name: parsed.data.name,
          namespace: parsed.data.namespace,
          object,
        },
      });

      const updated = result.data?.core_open_control_plane_io?.v2alpha1?.updateControlPlane;
      if (!updated) {
        throw new Error('ManagedControlPlaneV2 update returned no data');
      }

      return updated;
    },
    [updateMutation, telemetry],
  );

  return { updateMcp, loading, error };
}
