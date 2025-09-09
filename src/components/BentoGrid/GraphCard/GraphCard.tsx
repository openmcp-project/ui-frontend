import React from 'react';
import Graph from '../../Graphs/Graph';
import styles from './GraphCard.module.css';

export interface GraphCardProps {
  title?: string;
  className?: string;
}

export const GraphCard: React.FC<GraphCardProps> = ({ 
  className = '' 
}) => {
  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.simpleWrapper}>
        <Graph />
      </div>
    </div>
  );
};
