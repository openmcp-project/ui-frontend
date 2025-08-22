import React, { useMemo } from 'react';
import { RadarChart } from '@ui5/webcomponents-react-charts';
import { ManagedResourceItem, Condition } from '../../lib/shared/types';

interface CrossplaneHoverContentProps {
  allItems: ManagedResourceItem[];
  enabled: boolean;
}

export const CrossplaneHoverContent: React.FC<CrossplaneHoverContentProps> = ({
  allItems,
  enabled,
}) => {
  // Memoize resource type health calculations
  const { resourceTypeHealth, resourceTypeTotal } = useMemo(() => {
    const typeHealth: Record<string, number> = {};
    const typeTotal: Record<string, number> = {};
    
    allItems.forEach((item: ManagedResourceItem) => {
      const type = item.kind || 'Unknown';
      typeTotal[type] = (typeTotal[type] || 0) + 1;
      const conditions = item.status?.conditions || [];
      const ready = conditions.find((c: Condition) => c.type === 'Ready' && c.status === 'True');
      const synced = conditions.find((c: Condition) => c.type === 'Synced' && c.status === 'True');
      if (ready && synced) {
        typeHealth[type] = (typeHealth[type] || 0) + 1;
      }
    });

    return { resourceTypeHealth: typeHealth, resourceTypeTotal: typeTotal };
  }, [allItems]);

  // Memoize radar chart dataset
  const radarDataset = useMemo(() => {
    return Object.keys(resourceTypeTotal).map(type => {
      const total = resourceTypeTotal[type];
      const healthy = resourceTypeHealth[type] || 0;
      
      // Count creating resources (no conditions yet or unknown status)
      const creating = allItems.filter((item: ManagedResourceItem) => {
        if (item.kind !== type) return false;
        const conditions = item.status?.conditions || [];
        const hasReadyCondition = conditions.some((c: Condition) => c.type === 'Ready');
        const hasSyncedCondition = conditions.some((c: Condition) => c.type === 'Synced');
        return !hasReadyCondition || !hasSyncedCondition;
      }).length;
      
      return {
        type,
        healthy: Math.round((healthy / total) * 100),
        creating: Math.round((creating / total) * 100)
      };
    });
  }, [allItems, resourceTypeHealth, resourceTypeTotal]);

  if (!enabled || radarDataset.length === 0) {
    return null;
  }

  return (
    <div style={{ 
      width: '100%', 
      height: 300, 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      margin: '1rem 0',
      overflow: 'visible'
    }}>
      <RadarChart
        dataset={radarDataset}
        dimensions={[{ accessor: 'type' }]}
        measures={[
          {
            accessor: 'healthy',
            color: '#28a745',
            hideDataLabel: true,
            label: 'Healthy (%)'
          },
          {
            accessor: 'creating',
            color: '#fd7e14',
            hideDataLabel: true,
            label: 'Creating (%)'
          }
        ]}
        style={{ width: '100%', height: '100%', minWidth: 280, minHeight: 280 }}
        noLegend={false}
      />
    </div>
  );
};
