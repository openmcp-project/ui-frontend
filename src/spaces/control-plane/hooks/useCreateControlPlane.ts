import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { z } from 'zod';
import { buildMcpV2GraphQLInput } from '../../mcp/helpers/newControlPlaneInput.ts';
import { NewControlPlaneInput, ControlPlaneInputSchema } from '../../mcp/schemas/ControlPlaneInput.schema.ts';
import { CreateControlPlaneMutation } from './createControlPlaneMutation.ts';

export function useCreateControlPlane() {
  const [createMutation, { loading, error }] = useMutation(CreateControlPlaneMutation);

  const createMcp = useCallback(
    async (rawInput: NewControlPlaneInput) => {
      const parsed = ControlPlaneInputSchema.safeParse(rawInput);
      if (!parsed.success) {
        console.warn('Invalid McpV2 input:', z.treeifyError(parsed.error));
        throw new Error('Invalid ManagedControlPlaneV2 input');
      }

      const object = buildMcpV2GraphQLInput(parsed.data);

      const result = await createMutation({
        variables: {
          namespace: parsed.data.namespace,
          object,
        },
      });

      return result.data?.core_open_control_plane_io?.v2alpha1?.createControlPlane;
    },
    [createMutation],
  );

  return { createMcp, loading, error };
}
