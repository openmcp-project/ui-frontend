export interface Condition {
  type: unknown;
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
      subaccountRef?: { name: string };
      serviceManagerRef?: { name: string };
      spaceRef?: { name: string };
      orgRef?: { name: string };
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

export interface CustomNodeProps {
  data: NodeData;
}

export interface StatusIconProps {
  status: string;
}
