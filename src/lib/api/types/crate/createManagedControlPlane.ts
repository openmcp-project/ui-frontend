import { Resource } from '../resource';
import {
  CHARGING_TARGET_LABEL,
  DISPLAY_NAME_ANNOTATION,
} from '../shared/keyNames';
import { Member } from '../shared/members';

export type Annotations = Record<string, string>;
export type Labels = Record<string, string>;

export interface CreateManagedControlPlaneType {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    annotations: Annotations;
    labels: Labels;
  };
  spec: {
    members: Member[];
  };
}

export const CreateManagedControlPlane = (
  name: string,
  namespace: string,
  optional?: {
    displayName?: string;
    chargingTarget?: string;
    members?: Member[];
  },
): CreateManagedControlPlaneType => {
  return {
    apiVersion: 'core.openmcp.cloud/v1alpha1',
    kind: 'ManagedControlPlane',
    metadata: {
      name: name,
      namespace: namespace,
      annotations: {
        [DISPLAY_NAME_ANNOTATION]: optional?.displayName ?? '',
      },
      labels: {
        [CHARGING_TARGET_LABEL]: optional?.chargingTarget ?? '',
      },
    },
    spec: {
      members: optional?.members ?? [],
    },
  };
};

export const CreateManagedControlPlaneResource = (
  projectName: string,
  workspaceName: string,
): Resource<undefined> => {
  return {
    path: `/apis/core.openmcp.cloud/v1alpha1/namespaces/${projectName}--ws-${workspaceName}/managedcontrolplanes`,
    method: 'POST',
    jq: undefined,
    body: undefined,
  };
};
