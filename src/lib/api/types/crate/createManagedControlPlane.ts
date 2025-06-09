import { Resource } from '../resource';
import {
  CHARGING_TARGET_LABEL,
  DISPLAY_NAME_ANNOTATION,
} from '../shared/keyNames';
import { Member } from '../shared/members';

export interface CreateManagedControlPlaneType {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    annotations: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [annotation: string]: any;
    };
    labels: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [label: string]: any;
    };
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
    kind: 'ControlPlane',
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
    path: `/apis/core.openmcp.cloud/v1alpha1/namespaces/project-${projectName}--ws-${workspaceName}/managedcontrolplanes`,
    method: 'POST',
    jq: undefined,
    body: undefined,
  };
};
