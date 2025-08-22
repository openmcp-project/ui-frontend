import React from 'react';

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
    <div style={{ 
      marginBottom: '1rem',
      padding: '0.75rem',
      borderRadius: '6px',
      backgroundColor: 'white',
      border: '1px solid #e1e5e9',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      width: 'fit-content',
      margin: '0 auto 1rem auto',
      ...style
    }}>
      <div style={{ 
        fontSize: '0.95rem', 
        fontWeight: '600', 
        marginBottom: '0.5rem',
        color: '#374151',
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
            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              {item.count} {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
