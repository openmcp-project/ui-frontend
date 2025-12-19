export interface ManagedControlPlaneInterface {
  apiVersion: 'core.openmcp.cloud/v1alpha1' | string;
  kind: 'ManagedControlPlane' | string;
  metadata: KubernetesObjectMeta;
  spec: ManagedControlPlaneSpec;
  status?: ManagedControlPlaneStatus;
}

export interface KubernetesObjectMeta {
  name: string;
  namespace?: string;
  uid?: string;
  resourceVersion?: string;
  generation?: number;
  creationTimestamp?: string;
  annotations?: Record<string, string>;
  labels?: Record<string, string>;
  finalizers?: string[];
  managedFields?: ManagedFieldsEntry[];
}

export interface ManagedFieldsEntry {
  apiVersion?: string;
  fieldsType?: string;
  fieldsV1?: unknown;
  manager?: string;
  operation?: string;
  subresource?: string;
  time?: string;
}

export interface ManagedControlPlaneSpec {
  authentication?: MCPAuthenticationSpec;
  authorization?: MCPAuthorizationSpec;
  components?: MCPComponentsSpec;
}

export interface MCPAuthenticationSpec {
  enableSystemIdentityProvider?: boolean;
}

export interface MCPAuthorizationSpec {
  roleBindings?: MCPRoleBinding[];
}

export interface MCPRoleBinding {
  role: 'admin' | 'view' | string;
  subjects: MCPSubject[];
}

export interface MCPSubject {
  kind: 'User' | 'ServiceAccount' | string;
  name: string;
  namespace?: string;
}

export interface MCPComponentsSpec {
  apiServer?: MCPApiServerComponent;
  crossplane?: MCPCrossplaneComponent;
  externalSecretsOperator?: MCPVersionedComponent;
  flux?: MCPVersionedComponent;
  landscaper?: MCPLandscaperComponent;
}

export interface MCPLandscaperComponent {
  deployers?: string[];
}

export interface MCPApiServerComponent {
  type?: 'GardenerDedicated' | string;
}

export interface MCPCrossplaneComponent {
  version?: string;
  providers?: MCPCrossplaneProvider[];
}

export interface MCPCrossplaneProvider {
  name: string;
  version?: string;
}

export interface MCPVersionedComponent {
  version?: string;
}

export interface ManagedControlPlaneStatus {
  components?: MCPStatusComponents;
  conditions?: MCPCondition[];
  observedGeneration?: number;
  status?: string;
}

export interface MCPStatusComponents {
  apiServer?: {
    endpoint?: string;
    serviceAccountIssuer?: string;
  };
  authentication?: {
    access?: {
      key?: string;
      name?: string;
      namespace?: string;
    };
  };
  authorization?: Record<string, unknown>;
  cloudOrchestrator?: Record<string, unknown>;
}

export interface MCPCondition {
  lastTransitionTime?: string;
  managedBy?: string;
  message?: string;
  reason?: string;
  status?: 'True' | 'False' | 'Unknown' | string;
  type?:
    | 'APIServerHealthy'
    | 'AuthenticationHealthy'
    | 'AuthorizationHealthy'
    | 'CloudOrchestratorHealthy'
    | 'CrossplaneReady'
    | 'ExternalSecretsOperatorReady'
    | 'Ready'
    | 'MCPSuccessful'
    | string;
}
