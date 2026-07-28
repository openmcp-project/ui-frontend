import { CoreOpenControlPlaneIoV2alpha1ControlPlane_Input as ManagedControlPlaneV2Input } from '../../../types/__generated__/graphql/graphql.ts';
import { McpV2Input } from '../../mcp/schemas/mcpV2Input.schema.ts';

function toRoleBindingsInput(roleBindings: McpV2Input['roleBindings']) {
  return roleBindings.map((rb) => ({
    roleRefs: rb.roleRefs.map((ref) => ({ kind: ref.kind, name: ref.name })),
    subjects: rb.subjects.map((s) => ({
      kind: s.kind,
      name: s.name.trim(),
      apiGroup: 'rbac.authorization.k8s.io',
    })),
  }));
}

export function buildMcpV2GraphQLInput(input: McpV2Input): ManagedControlPlaneV2Input {
  return {
    apiVersion: 'core.open-control-plane.io/v2alpha1',
    kind: 'ControlPlane',
    metadata: {
      name: input.name,
      namespace: input.namespace,
    },
    spec: {
      iam: {
        oidc: {
          defaultProvider: {
            roleBindings: toRoleBindingsInput(input.roleBindings),
          },
          extraProviders: input.extraProviders.map((p) => ({
            name: p.name,
            issuer: p.issuer,
            clientID: p.clientID,
            usernameClaim: p.usernameClaim || undefined,
            // '' vs undefined must be preserved distinctly — do NOT normalize '' via `||` here.
            usernamePrefix: p.usernamePrefix,
            groupsClaim: p.groupsClaim || undefined,
            groupsPrefix: p.groupsPrefix,
            extraScopes: p.extraScopes?.length ? p.extraScopes : undefined,
            roleBindings: toRoleBindingsInput(p.roleBindings),
          })),
        },
      },
    },
  };
}
