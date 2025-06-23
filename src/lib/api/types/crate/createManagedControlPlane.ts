import { Resource } from '../resource';
import {
  CHARGING_TARGET_LABEL,
  DISPLAY_NAME_ANNOTATION,
} from '../shared/keyNames';
import { Member } from '../shared/members';
import { ComponentSelectionItem } from '../../../../components/ComponentsSelection/ComponentsSelection.tsx';

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
  components: Components;
}
interface Components {
  [key: string]:
    | {
        version: string;
      }
    | { type: 'GardenerDedicated' };
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
    selectedComponents?: ComponentSelectionItem[];
  },
  idpPrefix?: string,
): CreateManagedControlPlaneType => {
  console.log('components');
  const componentsObject: Components =
    optional?.selectedComponents
      ?.filter((component) => component.isSelected)
      .reduce((acc, item) => {
        acc[item.name] = { version: item.selectedVersion };
        return acc;
      }, {} as Components) ?? {};

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

      authorization: {
        roleBindings:
          optional?.members?.map((member) => ({
            role: member.roles[0],
            subjects: [
              {
                kind: 'User',
                name: idpPrefix ? `${idpPrefix}:${member.name}` : member.name,
              },
            ],
          })) ?? [],
      },
      components: {
        apiServer: { type: 'GardenerDedicated' },
        ...componentsObject,
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
