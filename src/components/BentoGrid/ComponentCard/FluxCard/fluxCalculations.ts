import { ManagedResourceItem } from '../../../../lib/shared/types';
import { APIError } from '../../../../lib/api/error';

export const HINT_COLORS = {
  flux: '#386ce4',
  inactive: '#e9e9e9ff',
} as const;

export interface FluxSegment {
  percentage: number;
  color: string;
  label: string;
  count?: number;
}

export interface FluxState {
  segments: FluxSegment[];
  label: string;
  showPercentage: boolean;
  isHealthy: boolean;
  showOnlyNonZero?: boolean;
  hasData?: boolean;
}

export const calculateGitOpsSegments = (
  allItems: ManagedResourceItem[],
  isLoading: boolean,
  error: APIError | undefined,
  enabled: boolean,
  t: (key: string) => string,
): FluxState => {
  if (isLoading) {
    return {
      segments: [{ percentage: 100, color: HINT_COLORS.inactive, label: t('Hints.common.loading') }],
      label: t('Hints.common.loading'),
      showPercentage: false,
      isHealthy: false,
      showOnlyNonZero: true,
      hasData: false,
    };
  }

  if (error) {
    return {
      segments: [{ percentage: 100, color: '#d22020ff', label: t('Hints.common.errorLoadingResources') }],
      label: t('Hints.common.errorLoadingResources'),
      showPercentage: false,
      isHealthy: false,
      showOnlyNonZero: true,
      hasData: false,
    };
  }

  if (!enabled) {
    return {
      segments: [{ percentage: 100, color: HINT_COLORS.inactive, label: t('Hints.GitOpsHint.inactive') }],
      label: t('Hints.GitOpsHint.inactive'),
      showPercentage: false,
      isHealthy: false,
      showOnlyNonZero: true,
      hasData: false,
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
      hasData: false,
    };
  }

  const fluxLabelCount = allItems.filter(
    (item: ManagedResourceItem) =>
      item?.metadata?.labels &&
      Object.prototype.hasOwnProperty.call(item.metadata.labels, 'kustomize.toolkit.fluxcd.io/name'),
  ).length;

  const progressValue = totalCount > 0 ? Math.round((fluxLabelCount / totalCount) * 100) : 0;
  const restPercentage = 100 - progressValue;

  return {
    segments: [
      { percentage: progressValue, color: HINT_COLORS.flux, label: t('common.progress'), count: fluxLabelCount },
      {
        percentage: restPercentage,
        color: HINT_COLORS.inactive,
        label: t('common.remaining'),
        count: totalCount - fluxLabelCount,
      },
    ],
    label: t('Hints.GitOpsHint.managed'),
    showPercentage: true,
    isHealthy: false, // Don't apply green styling to GitOps labels
    showOnlyNonZero: true,
    hasData: true,
  };
};

export const calculateFluxHealthSegments = (
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

  // Filter for Flux-managed items
  const fluxManagedItems = allItems.filter(
    (item: ManagedResourceItem) =>
      item?.metadata?.labels &&
      Object.prototype.hasOwnProperty.call(item.metadata.labels, 'kustomize.toolkit.fluxcd.io/name'),
  );

  if (fluxManagedItems.length === 0) {
    return {
      segments: [{ percentage: 100, color: HINT_COLORS.inactive, label: t('common.inactive') }],
      healthyPercentage: 0,
      isInactive: true,
    };
  }

  // Count health states
  const healthyCounts = fluxManagedItems.filter((item) =>
    item?.status?.conditions?.some((condition: any) => condition.type === 'Ready' && condition.status === 'True'),
  ).length;

  const total = fluxManagedItems.length;
  const healthyPercentage = Math.round((healthyCounts / total) * 100);
  const remainingPercentage = 100 - healthyPercentage;

  const segments = [
    {
      percentage: healthyPercentage,
      color: HINT_COLORS.flux,
      label: t('common.healthy'),
      count: healthyCounts,
    },
    remainingPercentage > 0 && {
      percentage: remainingPercentage,
      color: HINT_COLORS.inactive,
      label: t('common.remaining'),
      count: total - healthyCounts,
    },
  ].filter(Boolean) as { percentage: number; color: string; label: string; count: number }[];

  return {
    segments,
    healthyPercentage,
    isInactive: false,
  };
};

export interface FluxResourceStatus {
  segments: FluxSegment[];
  totalResources: number;
  hasData: boolean;
}

export const calculateFluxResourceStatus = (
  gitRepos: any[] = [],
  kustomizations: any[] = [],
  t: (key: string) => string,
): FluxResourceStatus => {
  const allResources = [
    ...(gitRepos.map(repo => ({
      ...repo,
      type: 'repository'
    })) || []),
    ...(kustomizations.map(kust => ({
      ...kust,
      type: 'kustomization'
    })) || [])
  ];

  const totalResources = allResources.length;

  if (totalResources === 0) {
    return {
      segments: [{ 
        percentage: 100, 
        color: HINT_COLORS.inactive, 
        label: t('Hints.GitOpsHint.noResources') || 'No resources',
        count: 0
      }],
      totalResources: 0,
      hasData: false,
    };
  }

  // Count ready vs not ready resources
  const readyResources = allResources.filter(resource => {
    const readyCondition = resource.status?.conditions?.find((c: any) => c.type === 'Ready');
    return readyCondition?.status === 'True';
  });

  const notReadyResources = allResources.filter(resource => {
    const readyCondition = resource.status?.conditions?.find((c: any) => c.type === 'Ready');
    return readyCondition?.status !== 'True';
  });

  const readyCount = readyResources.length;
  const notReadyCount = notReadyResources.length;

  const segments: FluxSegment[] = [];

  if (readyCount > 0) {
    segments.push({
      percentage: Math.round((readyCount / totalResources) * 100),
      color: HINT_COLORS.flux, // Blue for Ready (matching primary chart)
      label: t('common.ready') || 'Ready',
      count: readyCount,
    });
  }

  if (notReadyCount > 0) {
    segments.push({
      percentage: Math.round((notReadyCount / totalResources) * 100),
      color: HINT_COLORS.inactive, // Gray for Not Ready (matching primary chart)
      label: t('common.notReady') || 'Not Ready',
      count: notReadyCount,
    });
  }

  return {
    segments,
    totalResources,
    hasData: true,
  };
};
