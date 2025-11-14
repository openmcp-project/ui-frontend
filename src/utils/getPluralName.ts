const mapCustomResourceDefinitionToPlural = {
  workspace: 'workspaces',
  project: 'projects',
  managedcontrolplane: 'managedcontrolplanes',
  providerconfig: 'providerconfigs',
  provider: 'providers',
  cloudmanagement: 'cloudmanagements',
  gitrepository: 'gitrepositories',
  kustomization: 'kustomizations',
};

export const getCustomResourceDefinitionPluralName = (kind?: string): string | undefined => {
  if (!kind) {
    return undefined;
  }

  const lowerCaseKind = kind.toLowerCase();
  const mappedValue =
    mapCustomResourceDefinitionToPlural[lowerCaseKind as keyof typeof mapCustomResourceDefinitionToPlural];

  return mappedValue ?? `${lowerCaseKind}s`;
};
