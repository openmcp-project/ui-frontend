import { encodeRoleRef, uniqueRoles } from '../../../lib/api/types/shared/clusterRoles.ts';
import { Member } from '../../../lib/api/types/shared/members.ts';
import { ManagedControlPlaneV2 } from '../../onboarding/types/ControlPlane.ts';
import { idpPrefix } from '../../../utils/idpPrefix.ts';
import { stripIdpPrefix } from '../../../utils/stripIdpPrefix.ts';
import { ExtraProviderMetadata } from '../../mcp/schemas/mcpV2Input.schema.ts';

export interface McpV2FormState {
  members: Member[];
  extraProviders: ExtraProviderMetadata[];
}

function normalizeMemberKind(kindInput?: string | null): 'User' | 'Group' {
  const normalizedKind = (kindInput ?? '').toString().trim().toLowerCase();
  return normalizedKind === 'group' ? 'Group' : 'User';
}

type RoleBindingSource = {
  roleRefs?: ({ kind?: string | null; name?: string | null; namespace?: string | null } | null)[] | null;
  subjects?: ({ kind?: string | null; name?: string | null } | null)[] | null;
} | null;

// One member per (kind, name) carrying *every* role it is bound to across all of the provider's
// bindings — nothing is normalized or dropped, so saving an unchanged form writes equivalent bindings.
function extractProviderMembers(
  roleBindings: RoleBindingSource[] | null | undefined,
  toName: (kind: 'User' | 'Group', rawName: string) => string,
  provider?: string,
): Member[] {
  const membersByKey = new Map<string, Member>();
  for (const rb of roleBindings ?? []) {
    if (!rb) continue;
    const roles = uniqueRoles((rb.roleRefs ?? []).map((ref) => (ref ? encodeRoleRef(ref) : undefined)));
    for (const s of rb.subjects ?? []) {
      if (!s) continue;
      const kind = normalizeMemberKind(s.kind);
      const name = toName(kind, s.name ?? '');
      if (!name) continue;
      const key = `${kind}\n${name}`;
      const existing = membersByKey.get(key);
      if (existing) {
        existing.roles = uniqueRoles([...existing.roles, ...roles]);
      } else {
        membersByKey.set(key, { kind, name, roles: [...roles], ...(provider ? { provider } : {}) });
      }
    }
  }
  return Array.from(membersByKey.values());
}

export function extractMcpV2FormState(initialData: ManagedControlPlaneV2): McpV2FormState {
  const defaultMembers = extractProviderMembers(
    initialData.spec?.iam?.oidc?.defaultProvider?.roleBindings,
    (kind, rawName) => (kind === 'User' ? stripIdpPrefix(rawName, idpPrefix) : rawName),
  );

  const rawExtraProviders = (initialData.spec?.iam?.oidc?.extraProviders ?? [])
    .filter(Boolean)
    .filter((p) => !!p?.name);

  const extraProviders: ExtraProviderMetadata[] = rawExtraProviders.map((p) => ({
    name: p!.name!,
    issuer: p!.issuer ?? '',
    clientID: p!.clientID ?? '',
    usernameClaim: p!.usernameClaim ?? undefined,
    usernamePrefix: p!.usernamePrefix ?? undefined,
    groupsClaim: p!.groupsClaim ?? undefined,
    groupsPrefix: p!.groupsPrefix ?? undefined,
    extraScopes: (p!.extraScopes ?? []).filter((s): s is string => !!s),
  }));

  const extraMembers = rawExtraProviders.flatMap((p) =>
    extractProviderMembers(p!.roleBindings, (_kind, rawName) => rawName, p!.name!),
  );

  return {
    members: [...defaultMembers, ...extraMembers],
    extraProviders,
  };
}
