import { Condition, ManagedResourceItem, ProviderConfigs } from '../../lib/shared/types';
import { NodeData } from './types';

export type StatusType = 'ERROR' | 'OK';

export const getStatusCondition = (conditions?: Condition[]): Condition | undefined => {
  if (!conditions || !Array.isArray(conditions)) return undefined;
  return conditions.find((c) => c.type === 'Ready' || c.type === 'Healthy');
};

export const resolveProviderType = (configName: string, providerConfigsList: ProviderConfigs[]): string => {
  for (const configList of providerConfigsList || []) {
    const match = configList.items?.find((item) => item.metadata?.name === configName);

    if (match) {
      const apiVersion = match.apiVersion?.toLowerCase() || '';
      if (apiVersion.includes('btp')) return 'provider-btp';
      if (apiVersion.includes('cloudfoundry')) return 'provider-cf';
      if (apiVersion.includes('gardener')) return 'provider-gardener';
      if (apiVersion.includes('kubernetes')) return 'provider-kubernetes';
      return apiVersion || configName;
    }
  }

  return configName;
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
