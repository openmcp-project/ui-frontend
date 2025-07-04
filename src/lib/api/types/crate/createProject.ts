import { Resource } from '../resource';
import {
  CHARGING_TARGET_LABEL,
  CHARGING_TARGET_TYPE_LABEL,
  DISPLAY_NAME_ANNOTATION,
} from '../shared/keyNames';
import { Member } from '../shared/members';

export interface CreateProjectType {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
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

export const CreateProject = (
  projectName: string,
  optional?: {
    displayName?: string;
    chargingTarget?: string;
    chargingTargetType?: string;
    members?: Member[];
  },
): CreateProjectType => {
  return {
    apiVersion: 'core.openmcp.cloud/v1alpha1',
    kind: 'Project',
    metadata: {
      name: projectName,
      annotations: {
        [DISPLAY_NAME_ANNOTATION]: optional?.displayName ?? '',
      },
      labels: {
        [CHARGING_TARGET_TYPE_LABEL]: optional?.chargingTargetType ?? '',
        [CHARGING_TARGET_LABEL]: optional?.chargingTarget ?? '',
      },
    },
    spec: {
      members: optional?.members ?? [],
    },
  };
};

export const CreateProjectResource = (): Resource<undefined> => {
  return {
    path: `/apis/core.openmcp.cloud/v1alpha1/projects`,
    method: 'POST',
    jq: undefined,
    body: undefined,
  };
};
