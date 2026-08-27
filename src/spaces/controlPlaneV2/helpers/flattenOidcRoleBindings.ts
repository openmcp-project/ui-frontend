import { UNNAMED_PROVIDER_PREFIX } from '../../../lib/api/types/shared/members.ts';

export interface OidcProviderRoleBindingsSource {
  roleBindings?:
    | ({
        roleRefs?: ({ name?: string | null } | null)[] | null;
        subjects?: ({ kind?: string | null; name?: string | null } | null)[] | null;
      } | null)[]
    | null;
}

export interface OidcSource {
  defaultProvider?: OidcProviderRoleBindingsSource | null;
  extraProviders?: ((OidcProviderRoleBindingsSource & { name?: string | null }) | null)[] | null;
}

export interface MemberRoleBinding {
  role: string;
  subjects: { kind: string; name: string }[];
  // extraProviders[] entry name; undefined = default provider. Never undefined for an extra
  // provider without a name (see UNNAMED_PROVIDER_PREFIX).
  provider?: string;
}

// Flattens oidc roleRefs/subjects per provider into convertRoleBindingsToMembers' input shape.
export function flattenOidcRoleBindings(oidc?: OidcSource | null): MemberRoleBinding[] {
  const providers: { provider?: string; data?: OidcProviderRoleBindingsSource | null }[] = [
    { provider: undefined, data: oidc?.defaultProvider },
    ...(oidc?.extraProviders ?? []).map((p, index) => ({
      provider: p?.name ?? `${UNNAMED_PROVIDER_PREFIX}${index}`,
      data: p,
    })),
  ];

  return providers.flatMap(({ provider, data }) =>
    (data?.roleBindings ?? []).flatMap((binding) => {
      if (!binding) return [];
      const subjects = (binding.subjects ?? []).flatMap((s) =>
        s?.kind && s?.name ? [{ kind: s.kind, name: s.name }] : [],
      );
      return (binding.roleRefs ?? []).flatMap((ref) => (ref?.name ? [{ role: ref.name, subjects, provider }] : []));
    }),
  );
}
