import React from 'react';
import { Button, Icon } from '@ui5/webcomponents-react';
import { ResourceStatusCell } from '../Shared/ResourceStatusCell.tsx';
import styles from './CustomNode.module.css';
import { Handle, Position } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import { YamlText } from '../Yaml/YamlText.tsx';

export interface CustomNodeProps {
  label: string;
  type?: string;
  status: string;
  transitionTime?: string;
  statusMessage?: string;
  onYamlClick: () => void;
}

const CustomNode: React.FC<CustomNodeProps> = ({ label, type, status, transitionTime, statusMessage, onYamlClick }) => {
  const { t } = useTranslation();
  return (
    <div className={styles.nodeContainer}>
      <Handle type="target" position={Position.Top} className={styles.handleHidden} />
      <Handle type="source" position={Position.Bottom} className={styles.handleHidden} />
      <div className={styles.nodeContent}>
        <div className={styles.statusIcon}>
          <ResourceStatusCell
            isOk={status === 'OK'}
            transitionTime={transitionTime ?? ''}
            positiveText={t('common.healthy')}
            negativeText={t('errors.notHealthy')}
            message={statusMessage}
            hideOnHoverEffect={true}
          />
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
          <YamlText />
        </Button>
      </div>
    </div>
  );
};

export default CustomNode;
