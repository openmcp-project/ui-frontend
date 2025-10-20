import { Condition, ManagedResourceItem, ProviderConfigs, ManagedResourceGroup } from '../../lib/shared/types';
import { NodeData } from './types';

export type StatusType = 'ERROR' | 'OK';

export const getStatusCondition = (conditions?: Condition[]): Condition | undefined => {
  if (!conditions || !Array.isArray(conditions)) return undefined;
  return conditions.find((c) => c.type === 'Ready' || c.type === 'Healthy');
};

export const resolveProviderTypeFromApiVersion = (apiVersion: string): string => {
  // Extract domain from apiVersion (e.g. "account.btp.sap.crossplane.io/v1alpha1" -> "account.btp.sap.crossplane.io")
  const domain = apiVersion.split('/')[0] || '';

  // Remove "account" to normalize provider names
  // e.g "account.btp.sap.crossplane.io" -> "btp.sap.crossplane.io"
  const normalizedDomain = domain.replace(/^account\./, '');

  return normalizedDomain || 'unknown';
};

export const generateColorMap = (items: NodeData[], colorBy: string): Record<string, string> => {
  const colors = [
    '#FFC933', // MANGO 4
    '#FF8AF0', // PINK 4
    '#FEADC8', // RASPBERRY 4
    '#2CE0BF', // TEAL 4
    '#FF8CB2', // RED 4
    '#B894FF', // INDIGO 4
    '#049F9A', // TEAL 6
    '#FA4F96', // RASPBERRY 6
    '#F31DED', // PINK 6
    '#7858FF', // INDIGO 6
    '#07838F', // TEAL 7
    '#DF1278', // RASBERRY 7
    '#510080', // PINK 10
    '#5D36FF', // INDIGO 7
  ];

  const keys = (() => {
    if (colorBy === 'source') return Array.from(new Set(items.map((i) => i.providerType).filter(Boolean)));
    if (colorBy === 'flux') return Array.from(new Set(items.map((i) => i.fluxName ?? 'default')));
    return Array.from(new Set(items.map((i) => i.providerConfigName).filter(Boolean)));
  })();

  const map = new Map<string, string>();
  keys.forEach((key, i) => {
    map.set(key, colors[i % colors.length]);
  });

  if (colorBy === 'flux' && keys.includes('default')) {
    map.set('default', '#BFBFBF');
  }

  return Object.fromEntries(map);
};

export function extractRefs(item: ManagedResourceItem) {
  return {
    subaccountRef: item?.spec?.forProvider?.subaccountRef?.name,
    serviceManagerRef: item?.spec?.forProvider?.serviceManagerRef?.name,
    spaceRef: item?.spec?.forProvider?.spaceRef?.name,
    orgRef: item?.spec?.forProvider?.orgRef?.name,
    cloudManagementRef: item?.spec?.cloudManagementRef?.name,
    directoryRef: item?.spec?.forProvider?.directoryRef?.name,
    entitlementRef: item?.spec?.forProvider?.entitlementRef?.name,
    globalAccountRef: item?.spec?.forProvider?.globalAccountRef?.name,
    orgRoleRef: item?.spec?.forProvider?.orgRoleRef?.name,
    spaceMembersRef: item?.spec?.forProvider?.spaceMembersRef?.name,
    cloudFoundryEnvironmentRef: item?.spec?.forProvider?.cloudFoundryEnvironmentRef?.name,
    kymaEnvironmentRef: item?.spec?.forProvider?.kymaEnvironmentRef?.name,
    roleCollectionRef: item?.spec?.forProvider?.roleCollectionRef?.name,
    roleCollectionAssignmentRef: item?.spec?.forProvider?.roleCollectionAssignmentRef?.name,
    subaccountTrustConfigurationRef: item?.spec?.forProvider?.subaccountTrustConfigurationRef?.name,
    globalaccountTrustConfigurationRef: item?.spec?.forProvider?.globalaccountTrustConfigurationRef?.name,
  };
}

export function buildTreeData(
  managedResources: ManagedResourceGroup[] | undefined,
  providerConfigsList: ProviderConfigs[],
  onYamlClick: (item: ManagedResourceItem) => void,
): NodeData[] {
  if (!managedResources || !providerConfigsList) return [];

  const allNodesMap = new Map<string, NodeData>();

  managedResources.forEach((group: ManagedResourceGroup) => {
    group.items?.forEach((item: ManagedResourceItem) => {
      const name = item?.metadata?.name;
      const apiVersion = item?.apiVersion ?? '';
      const id = `${name}-${apiVersion}`;
      const kind = item?.kind;
      const providerConfigName = item?.spec?.providerConfigRef?.name ?? 'unknown';
      const providerType = resolveProviderTypeFromApiVersion(apiVersion);
      const statusCond = getStatusCondition(item?.status?.conditions);
      const status = statusCond?.status === 'True' ? 'OK' : 'ERROR';

      let fluxName: string | undefined;
      const labelsMap = (item.metadata as unknown as { labels?: Record<string, string> }).labels;
      if (labelsMap) {
        const key = Object.keys(labelsMap).find((k) => k.endsWith('/name'));
        if (key) fluxName = labelsMap[key];
      }

      const {
        subaccountRef,
        serviceManagerRef,
        spaceRef,
        orgRef,
        cloudManagementRef,
        directoryRef,
        entitlementRef,
        globalAccountRef,
        orgRoleRef,
        spaceMembersRef,
        cloudFoundryEnvironmentRef,
        kymaEnvironmentRef,
        roleCollectionRef,
        roleCollectionAssignmentRef,
        subaccountTrustConfigurationRef,
        globalaccountTrustConfigurationRef,
      } = extractRefs(item);

      const createReferenceIdWithApiVersion = (referenceName: string | undefined) => {
        if (!referenceName) return undefined;
        return `${referenceName}-${apiVersion}`;
      };

      if (id) {
        allNodesMap.set(id, {
          id,
          label: id,
          type: kind,
          providerConfigName,
          providerType,
          status,
          transitionTime: statusCond?.lastTransitionTime ?? '',
          statusMessage: statusCond?.reason ?? statusCond?.message ?? '',
          fluxName,
          parentId: createReferenceIdWithApiVersion(serviceManagerRef || subaccountRef),
          extraRefs: [
            spaceRef,
            orgRef,
            cloudManagementRef,
            directoryRef,
            entitlementRef,
            globalAccountRef,
            orgRoleRef,
            spaceMembersRef,
            cloudFoundryEnvironmentRef,
            kymaEnvironmentRef,
            roleCollectionRef,
            roleCollectionAssignmentRef,
            subaccountTrustConfigurationRef,
            globalaccountTrustConfigurationRef,
          ]
            .map(createReferenceIdWithApiVersion)
            .filter(Boolean) as string[],
          item,
          onYamlClick,
        });
      }
    });
  });

  return Array.from(allNodesMap.values());
}
