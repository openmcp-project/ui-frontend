export interface Condition {
  type: 'Ready' | 'Synced' | unknown;
  status: 'True' | 'False';
  lastTransitionTime: string;
}

export interface ManagedResourceItem {
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
}

export interface ManagedResourceGroup {
  items: ManagedResourceItem[];
}

export interface ProviderConfigItem {
  metadata?: { name: string };
  apiVersion?: string;
}

export interface ProviderConfig {
  items?: ProviderConfigItem[];
}

export interface NodeData {
  id: string;
  label: string;
  type?: string;
  providerConfigName: string;
  providerType: string;
  status: string;
  parentId?: string;
  extraRefs: string[];
  item: ManagedResourceItem;
}
