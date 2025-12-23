import { Resource } from '../resource';
import { CHARGING_TARGET_LABEL, CHARGING_TARGET_TYPE_LABEL, DISPLAY_NAME_ANNOTATION } from '../shared/keyNames';
import { Member } from '../shared/members';
import { AccountType } from '../../../../components/Members/EditMembers.tsx';
import { ManagedControlPlaneInterface } from '../mcpResource.ts';

export type Annotations = Record<string, string>;
export type Labels = Record<string, string>;

export interface ComponentsListItem {
  name: string;
  versions: string[];
  isSelected: boolean;
  selectedVersion: string;
  documentationUrl: string;
  isProvider: boolean;
  originalName?: string;
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
        version?: string;
        providers?: Provider[];
      }
    | { type: 'GardenerDedicated' }
    | { deployers?: string[] }
    | undefined;
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

export const removeComponents = ['cert-manager'];

export const replaceComponentsName: { originalName: string; replaceName: string }[] = [
  { originalName: 'sap-btp-service-operator', replaceName: 'btpServiceOperator' },
  { originalName: 'external-secrets', replaceName: 'externalSecretsOperator' },
];

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
  initialData?: ManagedControlPlaneInterface,
): CreateManagedControlPlaneType => {
  const selectedComponents: Components =
    optional?.componentsList
      ?.filter((component) => component.isSelected && !component.isProvider && !component.name.includes('crossplane'))
      .map((component) => {
        const mapping = replaceComponentsName.find((m) => m.originalName === component.name);
        return {
          ...component,
          name: mapping ? mapping.replaceName : component.name,
        };
      })
      .reduce((acc, item) => {
        acc[item.name] = { version: item.selectedVersion };
        return acc;
      }, {} as Components) ?? {};
  const crossplaneComponent = optional?.componentsList?.find(
    ({ name, isSelected }) => name === 'crossplane' && isSelected,
  );

  const selectedProviders: Provider[] =
    optional?.componentsList
      ?.filter(({ isSelected, isProvider }) => isProvider && isSelected)
      .map(({ name, selectedVersion, originalName }) => ({
        name: originalName ?? name,
        version: selectedVersion,
      })) ?? [];
  const crossplaneWithProviders = {
    crossplane: {
      version: crossplaneComponent?.selectedVersion ?? '',
      providers: selectedProviders,
    },
  };

  // Preserve landscaper from initialData if present (edit mode)
  const landscaperFromInitialData = initialData?.spec?.components?.landscaper;

  const components: Components = {
    ...selectedComponents,
    apiServer: { type: 'GardenerDedicated' },
    ...(crossplaneComponent ? crossplaneWithProviders : {}),
  };

  if (landscaperFromInitialData) {
    components.landscaper = landscaperFromInitialData as { deployers?: string[] };
  }

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
      components,
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
