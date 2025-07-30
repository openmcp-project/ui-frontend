import React from 'react';
import { NodeData, ProviderConfigItem } from './types';
import styles from './Legend.module.css';

interface LegendProps {
  nodes: NodeData[];
  colorBy: string;
  providers?: ProviderConfigItem[];
  generateColorMap: (
    items: NodeData[],
    colorBy: string,
    providers?: ProviderConfigItem[],
  ) => Record<string, string>;
}

export const Legend: React.FC<LegendProps> = ({
  nodes,
  colorBy,
  providers,
  generateColorMap,
}) => {
  const colorMap = generateColorMap(nodes, colorBy, providers);
  return (
    <div className={styles.legendContainer}>
      <h4 className={styles.legendTitle}>Legend:</h4>
      {Object.entries(colorMap).map(([key, color]) => (
        <div key={key} className={styles.legendRow}>
          <div
            className={styles.legendColorBox}
            style={{ backgroundColor: color }}
          />
          <span>{key === 'default' ? 'default' : key}</span>
        </div>
      ))}
    </div>
  );
};
