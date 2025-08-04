import React from 'react';
import styles from './Legend.module.css';
import { useTranslation } from 'react-i18next';

export interface LegendItem {
  name: string;
  color: string;
}

interface LegendProps {
  legendItems: LegendItem[];
}

export const Legend: React.FC<LegendProps> = ({ legendItems }) => {
  const { t } = useTranslation();

  return (
    <div className={styles.legendContainer}>
      <h4 className={styles.legendTitle}>{t('GraphsLegend.title')}</h4>
      {legendItems.map(({ name, color }) => (
        <div key={name} className={styles.legendRow}>
          <div className={styles.legendColorBox} style={{ backgroundColor: color }} />
          <span>{name}</span>
        </div>
      ))}
    </div>
  );
};