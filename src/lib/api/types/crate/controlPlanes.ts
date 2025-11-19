import { Resource } from '../resource';

export type ListControlPlanesType = ControlPlaneType;

export interface Metadata {
  name: string;
  namespace: string;
  creationTimestamp: string;
  annotations?: {
    'openmcp.cloud/display-name'?: string;
    'openmcp.cloud/created-by'?: string;
  };
}

export interface Subject {
  kind: string;
  name: string;
}

export interface RoleBinding {
  role: string;
  subjects: Subject[];
}

export interface Authorization {
  roleBindings: RoleBinding[];
}

export interface ControlPlaneType {
  metadata: Metadata;
  spec:
    | {
        authentication: {
          enableSystemIdentityProvider?: boolean;
        };
        authorization?: Authorization;
        components: ControlPlaneComponentsType;
      }
    | undefined;
  status: ControlPlaneStatusType | undefined;
}

export interface ControlPlaneComponentsType {
  crossplane: ControlPlaneComponentsSpecType | undefined;
  btpServiceOperator: ControlPlaneComponentsSpecType | undefined;
  externalSecretsOperator: ControlPlaneComponentsSpecType | undefined;
  kyverno: ControlPlaneComponentsSpecType | undefined;
  flux: ControlPlaneComponentsSpecType | undefined;
  landscaper: unknown;
}

export interface ControlPlaneComponentsSpecType {
  version: string;
}

export interface ControlPlaneStatusType {
  status: ReadyStatus;
  conditions: ControlPlaneStatusCondition[];
  access:
    | {
        key: string | undefined;
        name: string | undefined;
        namespace: string | undefined;
        kubeconfig: string | undefined;
      }
    | undefined;
}

export interface ControlPlaneStatusCondition {
  type: string;
  status: boolean | string;
  reason: string;
  message: string;
  lastTransitionTime: string;
}

export enum ReadyStatus {
  Ready = 'Ready',
  NotReady = 'Not Ready',
  InDeletion = 'Deleting',
}

export const ListControlPlanes = (
  projectName: string | null,
  workspaceName: string,
): Resource<ListControlPlanesType[]> => {
  return {
    path:
      projectName === null
        ? null
        : `/apis/core.openmcp.cloud/v1alpha1/namespaces/project-${projectName}--ws-${workspaceName}/managedcontrolplanes`,
    jq: '[.items[] |{spec: .spec | {authentication}, metadata: .metadata | {name, namespace, annotations}, status: { conditions: [.status.conditions[] | {type: .type, status: .status, message: .message, reason: .reason, lastTransitionTime: .lastTransitionTime}],  access: .status.components.authentication.access, status: .status.status } }]',
  };
};

export const ControlPlane = (
  projectName?: string,
  workspaceName?: string,
  controlPlaneName?: string,
): Resource<ControlPlaneType> => {
  return {
    path: `/apis/core.openmcp.cloud/v1alpha1/namespaces/project-${projectName}--ws-${workspaceName}/managedcontrolplanes/${controlPlaneName}`,
    jq: '{ spec: .spec | {components, authorization, authentication}, metadata: .metadata | {name, namespace, creationTimestamp, annotations}, status: { conditions: [.status.conditions[] | {type: .type, status: .status, message: .message, reason: .reason, lastTransitionTime: .lastTransitionTime}],  access: .status.components.authentication.access, status: .status.status }}',
  };
};
