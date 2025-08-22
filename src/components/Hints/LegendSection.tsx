import React from 'react';
import styles from './Hints.module.css';

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

export const LegendSection: React.FC<LegendSectionProps> = ({ 
  title, 
  items, 
  style 
}) => {
  return (
    <div className={styles.legendSection} style={{ 
      marginBottom: '1rem',
      padding: '0.75rem',
      borderRadius: '6px',
      width: 'fit-content',
      margin: '0 auto 1rem auto',
      ...style
    }}>
      <div className={styles.legendTitle} style={{ 
        fontSize: '0.95rem', 
        fontWeight: '600', 
        marginBottom: '0.5rem',
        textAlign: 'center'
      }}>
        {title}
      </div>
      <div style={{ 
        display: 'flex', 
        gap: '0.75rem',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {items.map((item, index) => (
          <div key={index} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.25rem' 
          }}>
            <div style={{ 
              width: '10px', 
              height: '10px', 
              backgroundColor: item.color, 
              borderRadius: '50%' 
            }} />
            <span className={styles.legendItem} style={{ fontSize: '0.85rem' }}>
              {item.count} {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
