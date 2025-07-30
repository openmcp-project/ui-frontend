import {
  Condition,
  NodeData,
  ProviderConfig,
  ProviderConfigItem,
} from './types';

export const getStatusFromConditions = (conditions?: Condition[]): string => {
  if (!conditions || !Array.isArray(conditions)) return 'ERROR';
  const relevant = conditions.find(
    (c) => c.type === 'Ready' || c.type === 'Healthy',
  );
  return relevant?.status === 'True' ? 'OK' : 'ERROR';
};

export const resolveProviderType = (
  configName?: string,
  providerConfigsList?: ProviderConfig[],
): string => {
  if (!configName) return 'unknown';

  for (const configList of providerConfigsList || []) {
    const match = configList.items?.find(
      (item) => item.metadata?.name === configName,
    );

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

export const generateColorMap = (
  items: NodeData[],
  colorBy: string,
  _providers?: ProviderConfigItem[],
): Record<string, string> => {
  const colors = [
    '#1abc9c',
    '#9b59b6',
    '#2ecc71',
    '#2980b9',
    '#3498db',
    '#e67e22',
    '#e74c3c',
    '#16a085',
    '#f39c12',
    '#d35400',
    '#8e44ad',
    '#c0392b',
  ];

  const keys =
    colorBy === 'source'
      ? Array.from(new Set(items.map((i) => i.providerType).filter(Boolean)))
      : Array.from(
          new Set(items.map((i) => i.providerConfigName).filter(Boolean)),
        );

  const map: Record<string, string> = {};
  keys.forEach((key, i) => {
    map[key] = colors[i % colors.length];
  });
  return map;
};
