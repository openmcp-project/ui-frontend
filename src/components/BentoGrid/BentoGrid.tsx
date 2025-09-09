import React from 'react';
import styles from './BentoGrid.module.css';

export type CardSize = 'small' | 'medium' | 'large' | 'extra-large';

export interface BentoCardProps {
  size: CardSize;
  children: React.ReactNode;
  className?: string;
  gridColumn?: string;
  gridRow?: string;
}

export interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export const BentoCard: React.FC<BentoCardProps> = ({ 
  size, 
  children, 
  className = '', 
  gridColumn,
  gridRow 
}) => {
  const cardClass = `${styles.bentoCard} ${styles[`card-${size}`]} ${className}`;
  
  const style: React.CSSProperties = {};
  if (gridColumn) style.gridColumn = gridColumn;
  if (gridRow) style.gridRow = gridRow;
  
  return (
    <div className={cardClass} style={style}>
      {children}
    </div>
  );
};

export const BentoGrid: React.FC<BentoGridProps> = ({ children, className = '' }) => {
  return (
    <div className={`${styles.bentoGrid} ${className}`}>
      {children}
    </div>
  );
};
