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
  // Name of the extraProviders[] entry this binding belongs to; undefined = default provider.
  // Callers whose query doesn't fetch extraProviders[].name (see UNNAMED_PROVIDER_PREFIX) get a
  // synthetic per-entry value here instead — never undefined, so an extra provider's members are
  // never mistaken for default-provider members.
  provider?: string;
}

// Flattens a ControlPlane's IAM oidc config (roleRefs[] + subjects[] per provider) into the flat
// shape expected by convertRoleBindingsToMembers, tagging each binding with the provider it came
// from so members granted access via different identity providers aren't conflated.
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
