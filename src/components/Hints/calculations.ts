import { ManagedResourceItem, Condition } from '../../lib/shared/types';
import { APIError } from '../../lib/api/error';
import { HintSegmentCalculator, HintState } from './types';

/**
 * Common colors used across all hints
 */
export const HINT_COLORS = {
  healthy: '#28a745',
  creating: '#0874f4',
  unhealthy: '#d22020ff',
  inactive: '#e9e9e9ff',
  managed: '#28a745',
  progress: '#fd7e14',
} as const;

/**
 * Crossplane-specific segment calculation
 */
export const calculateCrossplaneSegments: HintSegmentCalculator = (
  allItems: ManagedResourceItem[],
  isLoading: boolean,
  error: APIError | undefined,
  enabled: boolean,
  t: (key: string) => string,
): HintState => {
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

  // Calculate health statistics
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
      { percentage: healthyPercentage, color: HINT_COLORS.healthy, label: t('common.healthy') },
      { percentage: creatingPercentage, color: HINT_COLORS.creating, label: t('common.creating') },
      { percentage: unhealthyPercentage, color: HINT_COLORS.unhealthy, label: t('common.unhealthy') },
    ],
    label: t('Hints.CrossplaneHint.healthy'),
    showPercentage: true,
    isHealthy: healthyPercentage === 100 && totalCount > 0,
    showOnlyNonZero: true,
  };
};

/**
 * GitOps-specific segment calculation
 */
export const calculateGitOpsSegments: HintSegmentCalculator = (
  allItems: ManagedResourceItem[],
  isLoading: boolean,
  error: APIError | undefined,
  enabled: boolean,
  t: (key: string) => string,
): HintState => {
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
      segments: [{ percentage: 100, color: HINT_COLORS.inactive, label: t('Hints.GitOpsHint.inactive') }],
      label: t('Hints.GitOpsHint.inactive'),
      showPercentage: false,
      isHealthy: false,
      showOnlyNonZero: true,
    };
  }

  const totalCount = allItems.length;

  if (totalCount === 0) {
    return {
      segments: [{ percentage: 100, color: HINT_COLORS.inactive, label: t('Hints.GitOpsHint.noResources') }],
      label: t('Hints.GitOpsHint.noResources'),
      showPercentage: false,
      isHealthy: false,
      showOnlyNonZero: true,
    };
  }

  // Count the number of items with the flux label
  const fluxLabelCount = allItems.filter(
    (item: ManagedResourceItem) =>
      item?.metadata?.labels &&
      Object.prototype.hasOwnProperty.call(item.metadata.labels, 'kustomize.toolkit.fluxcd.io/name'),
  ).length;

  const progressValue = totalCount > 0 ? Math.round((fluxLabelCount / totalCount) * 100) : 0;
  const restPercentage = 100 - progressValue;
  const progressColor = progressValue >= 70 ? HINT_COLORS.healthy : HINT_COLORS.progress;

  return {
    segments: [
      { percentage: progressValue, color: progressColor, label: t('common.progress') },
      { percentage: restPercentage, color: HINT_COLORS.inactive, label: t('common.remaining') },
    ],
    label: t('Hints.GitOpsHint.managed'),
    showPercentage: true,
    isHealthy: progressValue >= 70,
    showOnlyNonZero: true,
  };
};

/**
 * Vault-specific segment calculation
 */
export const calculateVaultSegments: HintSegmentCalculator = (
  allItems: ManagedResourceItem[],
  isLoading: boolean,
  error: APIError | undefined,
  enabled: boolean,
  t: (key: string) => string,
): HintState => {
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
      segments: [{ percentage: 100, color: HINT_COLORS.inactive, label: t('Hints.VaultHint.inactive') }],
      label: t('Hints.VaultHint.inactive'),
      showPercentage: false,
      isHealthy: false,
      showOnlyNonZero: true,
    };
  }

  const hasResources = allItems.length > 0;
  const label = hasResources ? `100${t('Hints.VaultHint.progressAvailable')}` : t('Hints.VaultHint.noResources');
  const color = hasResources ? HINT_COLORS.healthy : HINT_COLORS.inactive;

  return {
    segments: [{ percentage: 100, color, label: t('common.active') }],
    label,
    showPercentage: true,
    isHealthy: hasResources,
    showOnlyNonZero: true,
  };
};

/**
 * Types for hover content calculations
 */
export interface ResourceTypeStats {
  type: string;
  total: number;
  healthy: number;
  creating: number;
  unhealthy: number;
  healthyPercentage: number;
  creatingPercentage: number;
  unhealthyPercentage: number;
}

export interface OverallStats {
  total: number;
  healthy: number;
  creating: number;
  unhealthy: number;
}

export interface CrossplaneHoverData {
  resourceTypeStats: ResourceTypeStats[];
  overallStats: OverallStats;
}

/**
 * Calculate comprehensive statistics for Crossplane hover content
 */
export const calculateCrossplaneHoverData = (allItems: ManagedResourceItem[]): CrossplaneHoverData => {
  const typeStats: Record<string, { total: number; healthy: number; creating: number; unhealthy: number }> = {};
  let totalHealthy = 0;
  let totalCreating = 0;
  let totalUnhealthy = 0;

  allItems.forEach((item: ManagedResourceItem) => {
    const type = item.kind || 'Unknown';

    if (!typeStats[type]) {
      typeStats[type] = { total: 0, healthy: 0, creating: 0, unhealthy: 0 };
    }

    typeStats[type].total++;

    const conditions = item.status?.conditions || [];
    const ready = conditions.find((c: Condition) => c.type === 'Ready' && c.status === 'True');
    const synced = conditions.find((c: Condition) => c.type === 'Synced' && c.status === 'True');

    if (ready && synced) {
      typeStats[type].healthy++;
      totalHealthy++;
    } else if (synced && !ready) {
      // Resource is synced but not ready - it's creating
      typeStats[type].creating++;
      totalCreating++;
    } else {
      // Resource has issues or is not synced
      typeStats[type].unhealthy++;
      totalUnhealthy++;
    }
  });

  const resourceTypeStats: ResourceTypeStats[] = Object.keys(typeStats).map((type) => {
    const stats = typeStats[type];
    return {
      type,
      total: stats.total,
      healthy: stats.healthy,
      creating: stats.creating,
      unhealthy: stats.unhealthy,
      healthyPercentage: Math.round((stats.healthy / stats.total) * 100),
      creatingPercentage: Math.round((stats.creating / stats.total) * 100),
      unhealthyPercentage: Math.round((stats.unhealthy / stats.total) * 100),
    };
  });

  return {
    resourceTypeStats,
    overallStats: {
      total: allItems.length,
      healthy: totalHealthy,
      creating: totalCreating,
      unhealthy: totalUnhealthy,
    },
  };
};
