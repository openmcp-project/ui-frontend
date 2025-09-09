import React from 'react';
import { Card, CardHeader } from '@ui5/webcomponents-react';
import Graph from '../../Graphs/Graph';
import styles from './GraphCard.module.css';

export interface GraphCardProps {
  title?: string;
  className?: string;
}

export const GraphCard: React.FC<GraphCardProps> = ({ 
  title = "Resource Graph", 
  className = '' 
}) => {
  return (
    <div className={`${styles.container} ${className}`}>
      <Card
        header={
          <CardHeader
            titleText={title}
            subtitleText="Resource Dependencies"
          />
        }
        className={styles.card}
      >
        <div className={styles.graphContainer}>
          <div className={styles.graphWrapper}>
            <Graph />
          </div>
        </div>
      </Card>
    </div>
  );
};
