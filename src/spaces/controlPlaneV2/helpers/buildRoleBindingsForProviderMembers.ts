import { MCP_V2_DEFAULT_ROLE, MCP_V2_VIEWER_ROLE, Member } from '../../../lib/api/types/shared/members.ts';
import {
  resolveExtraProviderGroupsPrefix,
  resolveExtraProviderUsernamePrefix,
} from '../../../utils/extraProviderPrefix.ts';
import { McpV2Input } from '../../mcp/schemas/mcpV2Input.schema.ts';

export const normalizeMcpV2Role = (roleInput?: string | null): string => {
  const normalizedRole = (roleInput ?? '').toString().trim().toLowerCase();
  if (normalizedRole === MCP_V2_VIEWER_ROLE || normalizedRole === 'view') {
    return MCP_V2_VIEWER_ROLE;
  }
  return MCP_V2_DEFAULT_ROLE;
};

// Groups a provider's members by (normalized) role into the CRD's roleBindings shape.
// For extraProviders, re-applies the username/groups prefix that extractMcpV2FormState.ts strips
// on read; the default provider is left unprefixed either way.
export function buildRoleBindingsForProviderMembers(
  providerMembers: Member[],
  extraProvider?: { name: string; usernamePrefix?: string; groupsPrefix?: string },
): McpV2Input['roleBindings'] {
  const normalizeKind = (kind: string): 'User' | 'Group' => {
    const lower = kind.trim().toLowerCase();
    if (lower === 'group') return 'Group';
    return 'User';
  };
  const applyPrefix = (rawName: string, kind: 'User' | 'Group'): string => {
    if (!extraProvider) return rawName;
    const resolvedPrefix =
      kind === 'Group'
        ? resolveExtraProviderGroupsPrefix(extraProvider)
        : resolveExtraProviderUsernamePrefix(extraProvider);
    return `${resolvedPrefix}${rawName}`;
  };
  const roleMap = new Map<string, { kind: 'User' | 'Group'; name: string }[]>();
  providerMembers
    .filter((m) => !!m.name)
    .forEach((m) => {
      const kind = normalizeKind(m.kind);
      const roleName = normalizeMcpV2Role(m.roles?.[0]);
      if (!roleMap.has(roleName)) roleMap.set(roleName, []);
      roleMap.get(roleName)!.push({
        kind,
        name: applyPrefix(m.name, kind),
      });
    });
  return Array.from(roleMap.entries()).map(([roleName, subjects]) => ({
    roleRefs: [{ kind: 'ClusterRole' as const, name: roleName }],
    subjects,
  }));
}
