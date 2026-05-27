import { ManagedControlPlaneV2Input } from '../../../types/__generated__/graphql/graphql.ts';
import { idpPrefix } from '../../../utils/idpPrefix.ts';
import { McpV2Input } from '../schemas/mcpV2Input.schema.ts';

function withIdpPrefix(kind: McpV2Input['roleBindings'][number]['subjects'][number]['kind'], name: string): string {
  if (kind !== 'User') {
    return name;
  }
  const trimmed = name.trim();
  const prefix = `${idpPrefix}:`;
  if (!trimmed || trimmed.startsWith(prefix)) {
    return trimmed;
  }
  return `${prefix}${trimmed}`;
}

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
                name: withIdpPrefix(s.kind, s.name),
                ...(s.kind === 'ServiceAccount'
                  ? { namespace: s.namespace }
                  : { apiGroup: 'rbac.authorization.k8s.io' }),
              })),
            })),
          },
        },
      },
    },
  };
}