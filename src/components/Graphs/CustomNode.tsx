import React from 'react';
import { Button, Icon } from '@ui5/webcomponents-react';

import styles from './CustomNode.module.css';
import { Handle, Position } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import { ConditionsViewButton } from '../Shared/ConditionsViewButton.tsx';
import { ControlPlaneStatusCondition } from '../../lib/api/types/crate/controlPlanes.ts';

export interface CustomNodeProps {
  label: string;
  type?: string;
  status: string;
  transitionTime?: string;
  statusMessage?: string;
  onYamlClick: () => void;
  conditions: ControlPlaneStatusCondition[];
}

const CustomNode: React.FC<CustomNodeProps> = ({
  conditions,
  label,
  type,
  status,

  onYamlClick,
}) => {
  return (
    <div className={styles.nodeContainer}>
      <Handle type="target" position={Position.Top} className={styles.handleHidden} />
      <Handle type="source" position={Position.Bottom} className={styles.handleHidden} />
      <div className={styles.nodeContent}>
        <div className={styles.statusIcon}>
          <ConditionsViewButton conditions={conditions} isOk={status === 'OK'} />
        </div>
        <div className={styles.nodeTextContainer}>
          <div className={styles.nodeLabel} title={label}>
            {label}
          </div>
          {type && <div className={styles.nodeType}>{type}</div>}
        </div>
      </div>
      <div className={styles.yamlButtonWrapper}>
        <Button design="Transparent" aria-label="YAML" title="YAML" onClick={onYamlClick}>
          <Icon name="document" design="Information" />
        </Button>
      </div>
    </div>
  );
};

export default CustomNode;
