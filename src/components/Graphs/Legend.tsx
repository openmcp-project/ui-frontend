import React from 'react';
import styles from './Legend.module.css';
export interface LegendItem {
  name: string;
  color: string;
}

interface LegendProps {
  legendItems: LegendItem[];
}

export const Legend: React.FC<LegendProps> = ({ legendItems }) => {
  return (
    <div className={styles.legendContainer}>
      {legendItems.map(({ name, color }) => (
        <div key={name} className={styles.legendRow}>
          <div className={styles.legendColorBox} style={{ backgroundColor: color }} />
          <span>{name}</span>
        </div>
      ))}
    </div>
  );
};
