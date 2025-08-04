import React from 'react';
import { Handle, Position } from 'reactflow';
import { Button, Icon } from '@ui5/webcomponents-react';
import StatusIcon from './StatusIcon';
import styles from './CustomNode.module.css';

export interface CustomNodeProps {
  label: string;
  type?: string;
  status: string;
  onYamlClick: () => void;
}

const CustomNode: React.FC<CustomNodeProps> = ({
  label,
  type,
  status,
  onYamlClick,
}) => (
  <div className={styles.nodeContainer}>
    <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
    <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
    <div className={styles.nodeContent}>
      <div className={styles.statusIcon}>
        <StatusIcon isOk={status === 'OK'} />
      </div>
      <div className={styles.nodeTextContainer}>
        <div className={styles.nodeLabel} title={label}>
          {label}
        </div>
        {type && <div className={styles.nodeType}>{type}</div>}
      </div>
    </div>
    <div className={styles.yamlButtonWrapper}>
      <Button
        design="Transparent"
        aria-label="YAML"
        title="YAML"
        onClick={onYamlClick}
      >
        <Icon name="document" design="Information" />
      </Button>
    </div>
  </div>
);

export default CustomNode;
