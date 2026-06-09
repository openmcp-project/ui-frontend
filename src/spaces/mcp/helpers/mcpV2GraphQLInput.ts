import { CoreOpenmcpCloudV2alpha1ManagedControlPlaneV2_Input as ManagedControlPlaneV2Input } from '../../../types/__generated__/graphql/graphql.ts';
import { McpV2Input } from '../schemas/mcpV2Input.schema.ts';

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
              subjects: rb.subjects.map((s) => ({
                kind: s.kind,
                name: s.name.trim(),
                apiGroup: 'rbac.authorization.k8s.io',
              })),
            })),
          },
        },
      },
    },
  };
}
