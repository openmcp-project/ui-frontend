import { Resource } from '../resource';
import { CHARGING_TARGET_LABEL, CHARGING_TARGET_TYPE_LABEL, DISPLAY_NAME_ANNOTATION } from '../shared/keyNames';
import { Member, MemberPayload } from '../shared/members';

export interface CreateWorkspaceType {
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
    members: MemberPayload[];
  };
}

export const CreateWorkspace = (
  projectName: string,
  namespace: string,
  optional?: {
    displayName?: string;
    chargingTarget?: string;
    chargingTargetType?: string;
    members?: Member[];
  },
): CreateWorkspaceType => {
  return {
    apiVersion: 'core.openmcp.cloud/v1alpha1',
    kind: 'Workspace',
    metadata: {
      name: projectName,
      namespace: namespace,
      annotations: {
        [DISPLAY_NAME_ANNOTATION]: optional?.displayName ?? '',
      },
      labels: {
        [CHARGING_TARGET_TYPE_LABEL]: optional?.chargingTargetType ?? '',
        [CHARGING_TARGET_LABEL]: optional?.chargingTarget ?? '',
      },
    },
    spec: {
      members:
        optional?.members?.map(({ kind, namespace, roles, name }) => ({
          kind,
          name,
          roles,
          namespace: kind === 'ServiceAccount' ? (namespace ?? 'default') : undefined,
        })) ?? [],
    },
  };
};

export const CreateWorkspaceResource = (namespace: string): Resource<undefined> => {
  return {
    path: `/apis/core.openmcp.cloud/v1alpha1/namespaces/${namespace}/workspaces`,
    method: 'POST',
    jq: undefined,
    body: undefined,
  };
};
