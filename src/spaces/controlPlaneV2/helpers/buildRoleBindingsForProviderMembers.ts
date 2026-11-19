import { decodeRoleRef, DEFAULT_CLUSTER_ROLE, uniqueRoles } from '../../../lib/api/types/shared/clusterRoles.ts';
import { Member } from '../../../lib/api/types/shared/members.ts';
import { McpV2Input } from '../../mcp/schemas/mcpV2Input.schema.ts';

type RoleBinding = McpV2Input['roleBindings'][number];

const normalizeKind = (kind: string): 'User' | 'Group' => (kind.trim().toLowerCase() === 'group' ? 'Group' : 'User');

// Builds the CRD's roleBindings for one provider. Members sharing the exact same set of roles end up
// in one binding (`roleRefs` = that set, `subjects` = those members), which keeps the YAML compact
// and stable across an extract → edit → build round trip.
// Subject names are written raw: the CRD adds an extraProvider's username/groups prefix to
// subjects automatically, so it must not be specified here (see the CRD's `usernamePrefix` docs).
export function buildRoleBindingsForProviderMembers(providerMembers: Member[]): McpV2Input['roleBindings'] {
  const bindingsByRoleSet = new Map<string, RoleBinding>();
  providerMembers
    .filter((m) => !!m.name)
    .forEach((m) => {
      const roles = uniqueRoles(m.roles ?? []);
      const effectiveRoles = roles.length ? roles : [DEFAULT_CLUSTER_ROLE];
      const key = [...effectiveRoles].sort().join('\n');
      if (!bindingsByRoleSet.has(key)) {
        bindingsByRoleSet.set(key, { roleRefs: effectiveRoles.map(decodeRoleRef), subjects: [] });
      }
      bindingsByRoleSet.get(key)!.subjects.push({ kind: normalizeKind(m.kind), name: m.name });
    });
  return Array.from(bindingsByRoleSet.values());
}
