import React from 'react';
import styles from './LegendSection.module.css';

interface LegendItem {
  label: string;
  count: number;
  color: string;
}

interface LegendSectionProps {
  title: string;
  items: LegendItem[];
  style?: React.CSSProperties;
}

export const LegendSection: React.FC<LegendSectionProps> = ({ title, items, style }) => {
  return (
    <div
      className={styles.legendSection}
      style={style}
    >
      <div className={styles.legendTitle}>
        {title}
      </div>
      <div className={styles.legendItemsContainer}>
        {items.map((item, index) => (
          <div
            key={index}
            className={styles.legendItemWrapper}
          >
            <div
              className={styles.legendDot}
              style={{ backgroundColor: item.color }}
            />
            <span className={styles.legendItem}>
              {item.count} {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
