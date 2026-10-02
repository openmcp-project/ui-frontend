import { CoreOpenControlPlaneIoV2alpha1ControlPlane_Input as ManagedControlPlaneV2Input } from '../../../types/__generated__/graphql/graphql.ts';
import {
  SUPPORT_LANDSCAPE_ANNOTATION,
  SUPPORT_OPS_CONTACTS_ANNOTATION,
  SUPPORT_SECURITY_CONTACTS_ANNOTATION,
  SUPPORT_SERVICE_IDS_ANNOTATION,
} from '../../../lib/api/types/shared/keyNames.ts';
import { McpV2Input } from '../../mcp/schemas/mcpV2Input.schema.ts';

function toRoleBindingsInput(roleBindings: McpV2Input['roleBindings']) {
  return roleBindings.map((rb) => ({
    roleRefs: rb.roleRefs.map((ref) => ({ kind: ref.kind, name: ref.name })),
    subjects: rb.subjects.map((s) => ({
      kind: s.kind,
      name: s.name.trim(),
    })),
  }));
}

// The landscape annotation is always written (even as '') so that selecting "Not Selected"
// explicitly clears any existing value. Other support annotations are omitted when empty so the
// gateway leaves any existing (e.g. server-managed) values untouched.
function buildSupportAnnotations(input: McpV2Input): Record<string, string> | undefined {
  const annotations: Record<string, string> = {};
  if (input.supportLandscape !== undefined) annotations[SUPPORT_LANDSCAPE_ANNOTATION] = input.supportLandscape;
  if (input.supportServiceIds) annotations[SUPPORT_SERVICE_IDS_ANNOTATION] = input.supportServiceIds;
  if (input.supportSecurityContacts) annotations[SUPPORT_SECURITY_CONTACTS_ANNOTATION] = input.supportSecurityContacts;
  if (input.supportOpsContacts) annotations[SUPPORT_OPS_CONTACTS_ANNOTATION] = input.supportOpsContacts;
  return Object.keys(annotations).length ? annotations : undefined;
}

export function buildMcpV2GraphQLInput(input: McpV2Input): ManagedControlPlaneV2Input {
  const annotations = buildSupportAnnotations(input);
  return {
    apiVersion: 'core.open-control-plane.io/v2alpha1',
    kind: 'ControlPlane',
    metadata: {
      name: input.name,
      namespace: input.namespace,
      ...(annotations ? { annotations } : {}),
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
