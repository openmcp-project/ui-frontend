interface UsernamePrefixableProvider {
  name: string;
  usernamePrefix?: string | null;
}

interface GroupsPrefixableProvider {
  name: string;
  groupsPrefix?: string | null;
}

// Resolves the CRD's default-vs-explicit-vs-disabled semantics for an extraProviders[] entry's
// usernamePrefix: '' disables prefixing, an explicit value is used verbatim, unset defaults to '<name>:'.
export function resolveExtraProviderUsernamePrefix(provider: UsernamePrefixableProvider): string {
  if (provider.usernamePrefix === '') return '';
  if (provider.usernamePrefix) return provider.usernamePrefix;
  return `${provider.name}:`;
}

// Same semantics as resolveExtraProviderUsernamePrefix, for groupsPrefix.
export function resolveExtraProviderGroupsPrefix(provider: GroupsPrefixableProvider): string {
  if (provider.groupsPrefix === '') return '';
  if (provider.groupsPrefix) return provider.groupsPrefix;
  return `${provider.name}:`;
}
