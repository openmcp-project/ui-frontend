import { ManagedResourceItem, Condition, ProviderConfigs } from '../../../../lib/shared/types';
import { APIError } from '../../../../lib/api/error';
import { resolveProviderType, generateColorMap } from '../../../Graphs/graphUtils';
import { NodeData } from '../../../Graphs/types';

export const HINT_COLORS = {
  healthy: '#28a745',
  creating: '#0874f4',
  unhealthy: '#d22020ff',
  inactive: '#e9e9e9ff',
} as const;

export interface CrossplaneSegment {
  percentage: number;
  color: string;
  label: string;
  count?: number;
}

export interface CrossplaneState {
  segments: CrossplaneSegment[];
  label: string;
  showPercentage: boolean;
  isHealthy: boolean;
  showOnlyNonZero?: boolean;
}

export const calculateCrossplaneSegments = (
  allItems: ManagedResourceItem[],
  isLoading: boolean,
  error: APIError | undefined,
  enabled: boolean,
  t: (key: string) => string,
): CrossplaneState => {
  if (isLoading) {
    return {
      segments: [{ percentage: 100, color: HINT_COLORS.inactive, label: t('Hints.common.loading') }],
      label: t('Hints.common.loading'),
      showPercentage: false,
      isHealthy: false,
      showOnlyNonZero: true,
    };
  }

  if (error) {
    return {
      segments: [{ percentage: 100, color: HINT_COLORS.unhealthy, label: t('Hints.common.errorLoadingResources') }],
      label: t('Hints.common.errorLoadingResources'),
      showPercentage: false,
      isHealthy: false,
      showOnlyNonZero: true,
    };
  }

  if (!enabled) {
    return {
      segments: [{ percentage: 100, color: HINT_COLORS.inactive, label: t('Hints.CrossplaneHint.inactive') }],
      label: t('Hints.CrossplaneHint.inactive'),
      showPercentage: false,
      isHealthy: false,
      showOnlyNonZero: true,
    };
  }

  const totalCount = allItems.length;

  if (totalCount === 0) {
    return {
      segments: [{ percentage: 100, color: HINT_COLORS.inactive, label: t('Hints.CrossplaneHint.noResources') }],
      label: t('Hints.CrossplaneHint.noResources'),
      showPercentage: false,
      isHealthy: false,
      showOnlyNonZero: true,
    };
  }

  const healthyCount = allItems.filter((item: ManagedResourceItem) => {
    const conditions = item.status?.conditions || [];
    const ready = conditions.find((c: Condition) => c.type === 'Ready' && c.status === 'True');
    const synced = conditions.find((c: Condition) => c.type === 'Synced' && c.status === 'True');
    return !!ready && !!synced;
  }).length;

  const creatingCount = allItems.filter((item: ManagedResourceItem) => {
    const conditions = item.status?.conditions || [];
    const ready = conditions.find((c: Condition) => c.type === 'Ready' && c.status === 'True');
    const synced = conditions.find((c: Condition) => c.type === 'Synced' && c.status === 'True');
    return !!synced && !ready;
  }).length;

  const unhealthyCount = totalCount - healthyCount - creatingCount;
  const healthyPercentage = Math.round((healthyCount / totalCount) * 100);
  const creatingPercentage = Math.round((creatingCount / totalCount) * 100);
  const unhealthyPercentage = Math.round((unhealthyCount / totalCount) * 100);

  return {
    segments: [
      { percentage: healthyPercentage, color: HINT_COLORS.healthy, label: t('common.healthy'), count: healthyCount },
      { percentage: creatingPercentage, color: HINT_COLORS.creating, label: t('common.creating'), count: creatingCount },
      { percentage: unhealthyPercentage, color: HINT_COLORS.unhealthy, label: t('common.unhealthy'), count: unhealthyCount },
    ],
    label: t('Hints.CrossplaneHint.healthy'),
    showPercentage: true,
    isHealthy: healthyPercentage === 100 && totalCount > 0,
    showOnlyNonZero: true,
  };
};

export const calculateCrossplaneHealthSegments = (
  allItems: ManagedResourceItem[],
  t: (key: string) => string,
  enabled: boolean,
  isLoading: boolean = false,
) => {
  if (isLoading) {
    return {
      segments: [{ percentage: 100, color: HINT_COLORS.inactive, label: t('common.loading') || 'Loading...' }],
      healthyPercentage: 0,
      isLoading: true,
    };
  }

  if (!enabled) {
    return {
      segments: [{ percentage: 100, color: HINT_COLORS.inactive, label: t('common.inactive') }],
      healthyPercentage: 0,
      isInactive: true,
    };
  }

  if (!allItems || allItems.length === 0) {
    return {
      segments: [{ percentage: 100, color: HINT_COLORS.inactive, label: t('common.inactive') }],
      healthyPercentage: 0,
      isInactive: true,
    };
  }

  // Count health states for all Crossplane managed resources
  const healthyCounts = allItems.filter(
    (item) => item?.status?.conditions?.some(
      (condition: any) => condition.type === 'Ready' && condition.status === 'True'
    )
  ).length;

  const total = allItems.length;
  const healthyPercentage = Math.round((healthyCounts / total) * 100);
  const remainingPercentage = 100 - healthyPercentage;
  
  const segments = [
    { 
      percentage: healthyPercentage, 
      color: '#38d4bc', 
      label: t('common.healthy'),
      count: healthyCounts 
    },
    remainingPercentage > 0 && { 
      percentage: remainingPercentage, 
      color: HINT_COLORS.inactive, 
      label: t('common.remaining'),
      count: total - healthyCounts 
    },
  ].filter(Boolean) as { percentage: number; color: string; label: string; count: number }[];

  return {
    segments,
    healthyPercentage,
    isInactive: false,
  };
};

// Utility function to calculate provider distribution with graph colors
export const calculateProviderDistribution = (items: ManagedResourceItem[], providerConfigs: ProviderConfigs[]) => {
  if (!items || items.length === 0) return { segments: [], totalProviders: 0 };

  // Count resources by provider type (same method as graph)
  const providerCounts: Record<string, number> = {};

  items.forEach((item) => {
    const providerConfigName = item?.spec?.providerConfigRef?.name ?? 'unknown';
    const providerType = resolveProviderType(providerConfigName, providerConfigs);
    providerCounts[providerType] = (providerCounts[providerType] || 0) + 1;
  });

  // Create NodeData-like objects for color generation (reuse graph's color logic)
  const nodeDataForColors = Object.keys(providerCounts).map((providerType) => ({
    providerType,
    providerConfigName: '', // Not needed for color generation
    fluxName: undefined,
  }));

  // Generate colors using the same logic as the graph
  const colorMap = generateColorMap(nodeDataForColors as NodeData[], 'source');

  // Convert to segments with percentages and counts
  const total = items.length;
  const segments = Object.entries(providerCounts)
    .map(([provider, count]) => ({
      percentage: Math.round((count / total) * 100),
      color: colorMap[provider] || '#BFBFBF', // fallback color
      label: provider.replace('provider-', '').toUpperCase(),
      count: count,
    }))
    .filter((segment) => segment.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage);

  return {
    segments,
    totalProviders: segments.length,
  };
};