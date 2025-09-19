import React from 'react';
import Graph from '../../Graphs/Graph';
import styles from './GraphCard.module.css';
import { ColorBy } from '../../Graphs/types';

export interface GraphCardProps {
  title?: string;
  className?: string;
  colorBy?: ColorBy;
}

export const GraphCard: React.FC<GraphCardProps> = ({ className = '', colorBy = 'source' }) => {
  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.simpleWrapper}>
        <Graph colorBy={colorBy} />
      </div>
    </div>
  );
};
