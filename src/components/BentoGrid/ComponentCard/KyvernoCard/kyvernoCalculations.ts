import { ManagedResourceItem } from '../../../../lib/shared/types';
import { APIError } from '../../../../lib/api/error';

export const HINT_COLORS = {
  healthy: '#28a745',
  unhealthy: '#d22020ff',
  inactive: '#e9e9e9ff',
} as const;

export interface KyvernoSegment {
  percentage: number;
  color: string;
  label: string;
  count?: number;
}

export interface KyvernoState {
  segments: KyvernoSegment[];
  label: string;
  showPercentage: boolean;
  isHealthy: boolean;
  showOnlyNonZero?: boolean;
}

export const calculateKyvernoSegments = (
  allItems: ManagedResourceItem[],
  isLoading: boolean,
  error: APIError | undefined,
  enabled: boolean,
  t: (key: string) => string,
): KyvernoState => {
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
      segments: [{ percentage: 100, color: HINT_COLORS.inactive, label: t('Hints.KyvernoHint.inactive') }],
      label: t('Hints.KyvernoHint.inactive'),
      showPercentage: false,
      isHealthy: false,
      showOnlyNonZero: true,
    };
  }

  const totalCount = allItems.length;

  if (totalCount === 0) {
    return {
      segments: [{ percentage: 100, color: HINT_COLORS.inactive, label: t('Hints.KyvernoHint.noResources') }],
      label: t('Hints.KyvernoHint.noResources'),
      showPercentage: false,
      isHealthy: false,
      showOnlyNonZero: true,
    };
  }

  // TODO: Implement Kyverno-specific logic
  // For now, return a placeholder
  return {
    segments: [{ percentage: 100, color: HINT_COLORS.inactive, label: t('common.notImplemented') }],
    label: t('Hints.KyvernoHint.title'),
    showPercentage: false,
    isHealthy: false,
    showOnlyNonZero: true,
  };
};
