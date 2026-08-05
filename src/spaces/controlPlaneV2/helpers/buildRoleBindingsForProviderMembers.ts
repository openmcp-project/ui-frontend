import { MCP_V2_DEFAULT_ROLE, MCP_V2_VIEWER_ROLE, Member } from '../../../lib/api/types/shared/members.ts';
import { McpV2Input } from '../../mcp/schemas/mcpV2Input.schema.ts';

export const normalizeMcpV2Role = (roleInput?: string | null): string => {
  const normalizedRole = (roleInput ?? '').toString().trim().toLowerCase();
  if (normalizedRole === MCP_V2_VIEWER_ROLE || normalizedRole === 'view') {
    return MCP_V2_VIEWER_ROLE;
  }
  return MCP_V2_DEFAULT_ROLE;
};

// Groups a provider's members by (normalized) role into the CRD's roleBindings shape.
// Subject names are written raw: the CRD adds an extraProvider's username/groups prefix to
// subjects automatically, so it must not be specified here (see the CRD's `usernamePrefix` docs).
export function buildRoleBindingsForProviderMembers(providerMembers: Member[]): McpV2Input['roleBindings'] {
  const normalizeKind = (kind: string): 'User' | 'Group' => {
    const lower = kind.trim().toLowerCase();
    if (lower === 'group') return 'Group';
    return 'User';
  };
  const roleMap = new Map<string, { kind: 'User' | 'Group'; name: string }[]>();
  providerMembers
    .filter((m) => !!m.name)
    .forEach((m) => {
      const kind = normalizeKind(m.kind);
      const roleName = normalizeMcpV2Role(m.roles?.[0]);
      if (!roleMap.has(roleName)) roleMap.set(roleName, []);
      roleMap.get(roleName)!.push({ kind, name: m.name });
    });
  return Array.from(roleMap.entries()).map(([roleName, subjects]) => ({
    roleRefs: [{ kind: 'ClusterRole' as const, name: roleName }],
    subjects,
  }));
}
