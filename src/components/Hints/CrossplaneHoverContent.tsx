import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RadarChart } from '@ui5/webcomponents-react-charts';
import { ManagedResourceItem } from '../../lib/shared/types';
import { calculateCrossplaneHoverData, HINT_COLORS } from './calculations';
import { LegendSection } from './LegendSection';

interface CrossplaneHoverContentProps {
  allItems: ManagedResourceItem[];
  enabled: boolean;
}

export const CrossplaneHoverContent: React.FC<CrossplaneHoverContentProps> = ({ allItems, enabled }) => {
  const { t } = useTranslation();

  // Calculate all statistics using the dedicated calculation function
  const { resourceTypeStats, overallStats } = useMemo(() => calculateCrossplaneHoverData(allItems), [allItems]);

  // Prepare radar chart dataset
  const radarDataset = useMemo(() => {
    return resourceTypeStats.map((stats) => ({
      type: stats.type,
      healthy: stats.healthyPercentage,
      creating: stats.creatingPercentage,
      unhealthy: stats.unhealthyPercentage,
    }));
  }, [resourceTypeStats]);

  if (!enabled || resourceTypeStats.length === 0) {
    return null;
  }

  // Prepare legend items with translations
  const legendItems = [
    {
      label: t('Hints.CrossplaneHint.hoverContent.healthy'),
      count: overallStats.healthy,
      color: HINT_COLORS.healthy,
    },
    {
      label: t('Hints.CrossplaneHint.hoverContent.creating'),
      count: overallStats.creating,
      color: HINT_COLORS.creating,
    },
    {
      label: t('Hints.CrossplaneHint.hoverContent.failing'),
      count: overallStats.unhealthy,
      color: HINT_COLORS.unhealthy,
    },
  ];
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '1rem 0',
        overflow: 'visible',
      }}
    >
      <LegendSection
        title={`${overallStats.total} ${t('Hints.CrossplaneHint.hoverContent.totalResources')}`}
        items={legendItems}
      />
      <div
        style={{
          width: '100%',
          height: 300,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <RadarChart
          dataset={radarDataset}
          dimensions={[{ accessor: 'type' }]}
          measures={[
            {
              accessor: 'healthy',
              color: HINT_COLORS.healthy,
              hideDataLabel: true,
              label: t('Hints.CrossplaneHint.hoverContent.healthy') + ' (%)',
            },
          ]}
          style={{ width: '100%', height: '100%', minWidth: 280, minHeight: 280 }}
          noLegend={true}
        />
      </div>
    </div>
  );
};
