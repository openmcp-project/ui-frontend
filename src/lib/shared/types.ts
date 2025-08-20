export type ProviderConfigsData = {
  provider: string;
  name: string;
  versions: [
    {
      name: string;
    },
  ];
};

export type ProviderConfigsDataForRequest = {
  provider: string;
  url: string;
  version: string;
};

export type ProviderConfigs = {
  provider: string;
  items: [ProviderConfigItem];
};

export interface ProviderConfigItem {
  kind: string;
  metadata: {
    provider: string;
    name: string;
    usage: string;
    creationTimestamp: string;
  };
  status: {
    count: string;
    users: string;
  };
  apiVersion?: string;
}

export type Condition = {
  type: 'Ready' | 'Synced' | unknown;
  status: 'True' | 'False';
  lastTransitionTime: string;
  reason?: string;
  message?: string;
};

export type ManagedResourceGroup = {
  items: ManagedResourceItem[];
};

export type ManagedResourceItem = {
  kind: string;
  metadata: {
    name: string;
    creationTimestamp: string;
  };
  apiVersion?: string;
  spec?: {
    providerConfigRef?: { name: string };
    forProvider?: {
      subaccountRef?: { name?: string };
      serviceManagerRef?: { name?: string };
      spaceRef?: { name?: string };
      orgRef?: { name?: string };
      directoryRef?: { name?: string };
      entitlementRef?: { name?: string };
      globalAccountRef?: { name?: string };
      orgRoleRef?: { name?: string };
      spaceMembersRef?: { name?: string };
      cloudFoundryEnvironmentRef?: { name?: string };
      kymaEnvironmentRef?: { name?: string };
      roleCollectionRef?: { name?: string };
      roleCollectionAssignmentRef?: { name?: string };
      subaccountTrustConfigurationRef?: { name?: string };
      globalaccountTrustConfigurationRef?: { name?: string };
    };
    cloudManagementRef?: { name: string };
  };
  status?: {
    conditions?: Condition[];
  };
};
