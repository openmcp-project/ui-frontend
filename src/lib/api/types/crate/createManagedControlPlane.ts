import { Resource } from '../resource';
import {
  CHARGING_TARGET_LABEL,
  DISPLAY_NAME_ANNOTATION,
} from '../shared/keyNames';
import { Member } from '../shared/members';

export type Annotations = Record<string, string>;
export type Labels = Record<string, string>;

export interface ComponentSelectionItem {
  name: string;
  versions: string[];
  isSelected: boolean;
  selectedVersion: string;
  documentationUrl: string;
}

interface RoleBinding {
  role: string;
  subjects: Subject[];
}
interface Subject {
  kind: 'User' | 'Group' | 'ServiceAccount';
  name: string;
}

interface Provider {
  name: string;
  version: string;
}
interface Spec {
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
    | { type: 'GardenerDedicated' }
    | { version: string; providers: Provider[] };
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
  const componentsObject: Components =
    optional?.selectedComponents
      ?.filter(
        (component) =>
          component.isSelected &&
          !component.name.includes('provider') &&
          !component.name.includes('crossplane'),
      )
      .reduce((acc, item) => {
        acc[item.name] = { version: item.selectedVersion };
        return acc;
      }, {} as Components) ?? {};
  const crossplane: Components = optional?.selectedComponents?.find(
    ({ name }) => name === 'crossplane',
  );
  const providers: Provider[] = optional?.selectedComponents
    ?.filter(({ name, isSelected }) => name.includes('provider') && isSelected)
    .map(({ name, selectedVersion }) => ({
      name: name,
      version: selectedVersion,
    }));
  const providersObject = 

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
      components: {
        ...componentsObject,
        apiServer: { type: 'GardenerDedicated' },
        // ...{crossplane ? { crossplane: { version: '', providers: [] } } : {}},
      },
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
