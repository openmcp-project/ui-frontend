import React, { useMemo } from 'react';
import { RadarChart } from '@ui5/webcomponents-react-charts';
import { LegendSection } from '../LegendSection/LegendSection';
import { styles } from '../HintsCardsRow';
import styles2 from './CardHoverContent.module.css';
import cx from 'clsx';

export interface LegendItem {
  label: string;
  count: number;
  color: string;
}

export interface RadarDataPoint {
  [key: string]: string | number;
}

export interface RadarMeasure {
  accessor: string;
  color: string;
  hideDataLabel?: boolean;
  label: string;
}

export interface RadarDimension {
  accessor: string;
}

export interface HoverContentProps {
  enabled: boolean;
  totalCount: number;
  totalLabel: string;
  legendItems: LegendItem[];
  radarDataset: RadarDataPoint[];
  radarDimensions: RadarDimension[];
  radarMeasures: RadarMeasure[];
  isLoading?: boolean;
}

// Helper function to truncate labels to max 13 characters
const truncateLabel = (label: string, maxLength: number = 13): string => {
  if (label.length <= maxLength) {
    return label;
  }
  return label.substring(0, maxLength) + '...';
};

export const HoverContent: React.FC<HoverContentProps> = ({
  enabled,
  totalCount,
  totalLabel,
  legendItems,
  radarDataset,
  radarDimensions,
  radarMeasures,
  isLoading = false,
}) => {
  // Process the dataset to truncate labels
  const processedDataset = useMemo(() => {
    return radarDataset.map((dataPoint) => {
      const processedDataPoint = { ...dataPoint };

      // Truncate labels for each dimension accessor
      radarDimensions.forEach((dimension) => {
        const value = dataPoint[dimension.accessor];
        if (typeof value === 'string') {
          processedDataPoint[dimension.accessor] = truncateLabel(value);
        }
      });

      return processedDataPoint;
    });
  }, [radarDataset, radarDimensions]);

  if (!enabled) {
    return null;
  }

  return (
    <div className={cx(styles.hoverContent, styles2.hoverContent)}>
      <LegendSection title={`${totalCount} ${totalLabel}`} items={legendItems} />
      <div className={styles2.chartContainer}>
        {isLoading || radarDataset.length === 0 ? (
          <div className={cx(styles.hoverContentLoading)}>
            <RadarChart
              dataset={[]}
              dimensions={[
                {
                  accessor: 'name',
                  formatter: (value: string | number) => String(value || ''),
                },
              ]}
              measures={[
                {
                  accessor: 'users',
                  formatter: (value: string | number) => String(value || ''),
                  label: 'Users',
                },
                {
                  accessor: 'sessions',
                  formatter: (value: string | number) => String(value || ''),
                  hideDataLabel: true,
                  label: 'Active Sessions',
                },
                {
                  accessor: 'volume',
                  label: 'Vol.',
                },
              ]}
              style={{ width: '100%', height: '100%', minWidth: 280, minHeight: 280 }}
              noLegend={true}
              noAnimation
              onClick={() => {}}
              onDataPointClick={() => {}}
              onLegendClick={() => {}}
            />
          </div>
        ) : (
          <RadarChart
            dataset={processedDataset}
            dimensions={radarDimensions}
            measures={radarMeasures}
            noAnimation
            style={{ width: '100%', height: '100%', minWidth: 280, minHeight: 280 }}
            noLegend={true}
          />
        )}
      </div>
    </div>
  );
};
