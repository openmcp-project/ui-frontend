import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { z } from 'zod';
import { buildMcpV2GraphQLInput } from '../../mcp/helpers/newControlPlaneInput.ts';
import { NewControlPlaneInput, ControlPlaneInputSchema } from '../../mcp/schemas/ControlPlaneInput.schema.ts';
import { UpdateNewControlPlaneMutation } from './useUpdateControlPlaneMutation.ts';

export function useUpdateControlPlane() {
  const [updateMutation, { loading, error }] = useMutation(UpdateNewControlPlaneMutation);

  const updateMcp = useCallback(
    async (rawInput: NewControlPlaneInput) => {
      const parsed = ControlPlaneInputSchema.safeParse(rawInput);
      if (!parsed.success) {
        console.warn('Invalid McpV2 input:', z.treeifyError(parsed.error));
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
    [updateMutation],
  );

  return { updateMcp, loading, error };
}
