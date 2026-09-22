import { MCP_V2_DEFAULT_ROLE, MCP_V2_VIEWER_ROLE, Member } from '../../../lib/api/types/shared/members.ts';
import { ManagedControlPlaneV2 } from '../../onboarding/types/ControlPlane.ts';
import { idpPrefix } from '../../../utils/idpPrefix.ts';
import { stripIdpPrefix } from '../../../utils/stripIdpPrefix.ts';
import { ExtraProviderMetadata } from '../../mcp/schemas/mcpV2Input.schema.ts';

export interface McpV2FormState {
  members: Member[];
  extraProviders: ExtraProviderMetadata[];
}

function normalizeMcpV2Role(roleInput?: string | null): string {
  const normalizedRole = (roleInput ?? '').toString().trim().toLowerCase();
  if (normalizedRole === MCP_V2_VIEWER_ROLE || normalizedRole === 'view') {
    return MCP_V2_VIEWER_ROLE;
  }
  return MCP_V2_DEFAULT_ROLE;
}

function normalizeMemberKind(kindInput?: string | null): 'User' | 'Group' {
  const normalizedKind = (kindInput ?? '').toString().trim().toLowerCase();
  return normalizedKind === 'group' ? 'Group' : 'User';
}

export function extractMcpV2FormState(initialData: ManagedControlPlaneV2): McpV2FormState {
  const defaultRoleBindings = (initialData.spec?.iam?.oidc?.defaultProvider?.roleBindings ?? []).filter(Boolean);

  const defaultMembers: Member[] = defaultRoleBindings
    .flatMap((rb) => {
      const roleName = normalizeMcpV2Role(rb?.roleRefs?.filter(Boolean)?.[0]?.name);
      return (rb?.subjects ?? []).filter(Boolean).map((s) => {
        const kind = normalizeMemberKind(s?.kind);
        const rawName = s?.name ?? '';
        return {
          kind,
          name: kind === 'User' ? stripIdpPrefix(rawName, idpPrefix) : rawName,
          roles: [roleName],
        };
      });
    })
    .filter((m) => !!m.name);

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

  const extraMembers: Member[] = rawExtraProviders
    .flatMap((p) => {
      const providerName = p!.name!;
      const roleBindings = (p!.roleBindings ?? []).filter(Boolean);
      return roleBindings.flatMap((rb) => {
        const roleName = normalizeMcpV2Role(rb?.roleRefs?.filter(Boolean)?.[0]?.name);
        return (rb?.subjects ?? []).filter(Boolean).map((s) => {
          const kind = normalizeMemberKind(s?.kind);
          return {
            kind,
            name: s?.name ?? '',
            roles: [roleName],
            provider: providerName,
          };
        });
      });
    })
    .filter((m) => !!m.name);

  return {
    members: [...defaultMembers, ...extraMembers],
    extraProviders,
  };
}
