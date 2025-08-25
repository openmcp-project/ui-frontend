import React from 'react';
import { RadarChart } from '@ui5/webcomponents-react-charts';
import { LegendSection } from './LegendSection';

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
}

export const HoverContent: React.FC<HoverContentProps> = ({
  enabled,
  totalCount,
  totalLabel,
  legendItems,
  radarDataset,
  radarDimensions,
  radarMeasures,
}) => {
  if (!enabled || radarDataset.length === 0) {
    return null;
  }

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
        title={`${totalCount} ${totalLabel}`}
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
          dimensions={radarDimensions}
          measures={radarMeasures}
          style={{ width: '100%', height: '100%', minWidth: 280, minHeight: 280 }}
          noLegend={true}
        />
      </div>
    </div>
  );
};
