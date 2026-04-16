import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { z } from 'zod';
import { ManagedControlPlaneV2Input } from '../../../types/__generated__/graphql/graphql.ts';
import { McpV2Input, McpV2InputSchema } from '../schemas/mcpV2Input.schema.ts';
import { CreateManagedControlPlaneV2Mutation } from './useCreateManagedControlPlaneV2Mutation.ts';

export function buildMcpV2GraphQLInput(input: McpV2Input): ManagedControlPlaneV2Input {
  return {
    apiVersion: 'core.openmcp.cloud/v2alpha1',
    kind: 'ManagedControlPlaneV2',
    metadata: {
      name: input.name,
      namespace: input.namespace,
    },
    spec: {
      iam: {
        oidc: {
          defaultProvider: {
            roleBindings: input.roleBindings.map((rb) => ({
              roleRefs: rb.roleRefs.map((ref) => ({ kind: ref.kind, name: ref.name })),
              subjects: rb.subjects.map((s) => ({ kind: s.kind, name: s.name })),
            })),
          },
        },
      },
    },
  };
}

export function useCreateManagedControlPlaneV2GraphQL() {
  const [createMutation, { loading, error }] = useMutation(CreateManagedControlPlaneV2Mutation);

  const createMcp = useCallback(
    async (rawInput: McpV2Input) => {
      const parsed = McpV2InputSchema.safeParse(rawInput);
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

      return result.data?.core_openmcp_cloud?.v2alpha1?.createManagedControlPlaneV2;
    },
    [createMutation],
  );

  return { createMcp, loading, error };
}
