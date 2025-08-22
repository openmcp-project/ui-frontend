import { ManagedResourceItem, Condition } from '../../lib/shared/types';

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

  const resourceTypeStats: ResourceTypeStats[] = Object.keys(typeStats).map(type => {
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
