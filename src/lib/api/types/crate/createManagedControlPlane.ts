import { Resource } from '../resource';
import { CHARGING_TARGET_LABEL, CHARGING_TARGET_TYPE_LABEL, DISPLAY_NAME_ANNOTATION } from '../shared/keyNames';
import { Member } from '../shared/members';
import { AccountType } from '../../../../components/Members/EditMembers.tsx';

export type Annotations = Record<string, string>;
export type Labels = Record<string, string>;

export interface ComponentsListItem {
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
  kind: AccountType;
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

// rename is used to make creation of MCP working properly
const replaceComponentsName: Record<string, string> = {
  'sap-btp-service-operator': 'btpServiceOperator',
  'external-secrets': 'externalSecretsOperator',
};

export const removeComponents = ['cert-manager'];

export const CreateManagedControlPlane = (
  name: string,
  namespace: string,
  optional?: {
    displayName?: string;
    chargingTarget?: string;
    chargingTargetType?: string;
    members?: Member[];
    componentsList?: ComponentsListItem[];
  },
  idpPrefix?: string,
): CreateManagedControlPlaneType => {
  const selectedComponentsListObject: Components =
    optional?.componentsList
      ?.filter(
        (component) =>
          component.isSelected && !component.name.includes('provider') && !component.name.includes('crossplane'),
      )
      .map((component) => ({
        ...component,
        name: Object.prototype.hasOwnProperty.call(replaceComponentsName, component.name)
          ? replaceComponentsName[component.name]
          : component.name,
      }))
      .reduce((acc, item) => {
        acc[item.name] = { version: item.selectedVersion };
        return acc;
      }, {} as Components) ?? {};
  const crossplaneComponent = optional?.componentsList?.find(
    ({ name, isSelected }) => name === 'crossplane' && isSelected,
  );

  const providersListObject: Provider[] =
    optional?.componentsList
      ?.filter(({ name, isSelected }) => name.includes('provider') && isSelected)
      .map(({ name, selectedVersion }) => ({
        name: name,
        version: selectedVersion,
      })) ?? [];
  const crossplaneWithProvidersListObject = {
    crossplane: {
      version: crossplaneComponent?.selectedVersion ?? '',
      providers: providersListObject,
    },
  };

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
        [CHARGING_TARGET_TYPE_LABEL]: optional?.chargingTargetType ?? '',
        [CHARGING_TARGET_LABEL]: optional?.chargingTarget ?? '',
      },
    },
    spec: {
      authentication: { enableSystemIdentityProvider: true },
      components: {
        ...selectedComponentsListObject,
        apiServer: { type: 'GardenerDedicated' },
        ...(crossplaneComponent ? crossplaneWithProvidersListObject : {}),
      },
      authorization: {
        roleBindings:
          optional?.members?.map((member) => ({
            role: member.roles?.[0],
            subjects: [
              {
                kind: member.kind as AccountType,
                name: idpPrefix && member.kind === 'User' ? `${idpPrefix}:${member.name}` : member.name,
                namespace: member.kind === 'ServiceAccount' ? (member.namespace ?? 'default') : undefined,
              },
            ],
          })) ?? [],
      },
    },
  };
};
export const CreateManagedControlPlaneResource = (projectName: string, workspaceName: string): Resource<undefined> => {
  return {
    path: `/apis/core.openmcp.cloud/v1alpha1/namespaces/${projectName}--ws-${workspaceName}/managedcontrolplanes`,
    method: 'POST',
    jq: undefined,
    body: undefined,
  };
};

export const UpdateManagedControlPlaneResource = (
  projectName: string,
  workspaceName: string,
  name: string,
): Resource<undefined> => {
  return {
    path: `/apis/core.openmcp.cloud/v1alpha1/namespaces/${projectName}--ws-${workspaceName}/managedcontrolplanes/${name}`,
    method: 'PATCH',
    jq: undefined,
    body: undefined,
  };
};
