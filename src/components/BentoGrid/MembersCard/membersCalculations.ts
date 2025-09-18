import { APIError } from '../../../lib/api/error';

export const HINT_COLORS = {
  roles: '#08848c',
  inactive: '#e9e9e9ff',
  unhealthy: '#d22020ff',
} as const;

export interface MemberItem {
  role?: string;
}

export interface MemberSegment {
  percentage: number;
  color: string;
  label: string;
  count?: number;
}

export interface MemberState {
  segments: MemberSegment[];
  label: string;
  showPercentage: boolean;
  isHealthy: boolean;
  showOnlyNonZero?: boolean;
}

export const calculateMembersSegments = (
  allItems: MemberItem[],
  isLoading: boolean,
  error: APIError | undefined,
  enabled: boolean,
  t: (key: string) => string,
): MemberState => {
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
      segments: [{ percentage: 100, color: HINT_COLORS.inactive, label: t('Hints.MembersHint.inactive') }],
      label: t('Hints.MembersHint.inactive'),
      showPercentage: false,
      isHealthy: false,
      showOnlyNonZero: true,
    };
  }
  const totalCount = allItems.length;
  if (totalCount === 0) {
    return {
      segments: [{ percentage: 100, color: HINT_COLORS.inactive, label: t('Hints.MembersHint.noMembers') }],
      label: t('Hints.MembersHint.noMembers'),
      showPercentage: false,
      isHealthy: false,
      showOnlyNonZero: true,
    };
  }
  // Count the number of roles and their distribution
  const roleCounts: Record<string, number> = {};

  allItems.forEach((item: MemberItem) => {
    const role = item?.role || 'unknown';
    roleCounts[role] = (roleCounts[role] || 0) + 1;
  });

  const segments = Object.entries(roleCounts)
    .map(([role, count]) => ({
      percentage: Math.round((count / totalCount) * 100),
      color: HINT_COLORS.roles, // All roles use the same teal color
      label: role.charAt(0).toUpperCase() + role.slice(1),
      count,
    }))
    .filter((segment) => segment.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage);

  return {
    segments,
    label: `Users ${totalCount}`,
    showPercentage: false,
    isHealthy: false, // Changed to false to prevent green styling
    showOnlyNonZero: true,
  };
};
