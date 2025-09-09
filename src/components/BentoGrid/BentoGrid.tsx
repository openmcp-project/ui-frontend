import React from 'react';
import styles from './BentoGrid.module.css';

export type CardSize = 'small' | 'medium' | 'large' | 'extra-large';

export interface BentoCardProps {
  size: CardSize;
  children: React.ReactNode;
  className?: string;
}

export interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export const BentoCard: React.FC<BentoCardProps> = ({ size, children, className = '' }) => {
  const cardClass = `${styles.bentoCard} ${styles[`card-${size}`]} ${className}`;
  
  return (
    <div className={cardClass}>
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
