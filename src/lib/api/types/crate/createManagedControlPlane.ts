import { Resource } from '../resource';
import {
  CHARGING_TARGET_LABEL,
  DISPLAY_NAME_ANNOTATION,
} from '../shared/keyNames';
import { Member } from '../shared/members';

export type Annotations = Record<string, string>;
export type Labels = Record<string, string>;

interface RoleBinding {
  role: string; // The name of the role being bound
  subjects: Subject[]; // A list of subjects the role is bound to
}
interface Subject {
  kind: 'User' | 'Group' | 'ServiceAccount'; // The type of subject
  name: string; // The name of the subject
}
interface Spec {
  // desiredRegion: {
  //   name: string;
  //   direction: string;
  // };
  authentication: {
    enableSystemIdentityProvider: boolean;
  };
  authorization: {
    roleBindings: RoleBinding[];
  };
  // components: Components;
}
interface Components {
  [key: string]: {
    type: string;
  };
}

export interface CreateManagedControlPlaneType {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    annotations: Annotations;
    labels: Labels;
  };
  spec: Spec;
}

export const CreateManagedControlPlane = (
  name: string,
  namespace: string,
  optional?: {
    displayName?: string;
    chargingTarget?: string;
    members?: Member[];
  },
  idpPrefix?: string,
): CreateManagedControlPlaneType => {
  console.log(optional);
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
      authentication: { enableSystemIdentityProvider: true },
      //   members:
      //     optional?.members?.map((member) => ({
      //       ...member,
      //       name: idpPrefix ? `${idpPrefix}:${member.name}` : member.name,
      //     })) ?? [],
      // },
      // components: {test: {type: 'version'},
      authorization: {
        roleBindings:
          optional?.members?.map((member) => ({
            role: member.roles[0], // this is wrong should be admin/view
            subjects: [
              {
                kind: 'User',
                name: idpPrefix ? `${idpPrefix}:${member.name}` : member.name,
              },
            ],
          })) ?? [],
      },
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
