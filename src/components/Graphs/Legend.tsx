import React from 'react';
import styles from './Legend.module.css';
export interface LegendItem {
  name: string;
  color: string;
}

interface LegendProps {
  legendItems: LegendItem[];
  horizontal?: boolean;
}

export const Legend: React.FC<LegendProps> = ({ legendItems, horizontal = false }) => {
  return (
    <div className={horizontal ? styles.legendContainer : styles.legendContainerVertical}>
      {legendItems.map(({ name, color }) => (
        <div key={name} className={horizontal ? styles.legendRow : `${styles.legendRow} ${styles.legendRowVertical}`}>
          <div className={styles.legendColorBox} style={{ backgroundColor: color }} />
          <span>{name}</span>
        </div>
      ))}
    </div>
  );
};
