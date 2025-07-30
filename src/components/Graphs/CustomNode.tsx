import React from 'react';
import { Handle, Position } from 'reactflow';
import { ThemingParameters } from '@ui5/webcomponents-react-base';
import { YamlViewButton } from '../Yaml/YamlViewButton';
import StatusIcon from './StatusIcon';
import { CustomNodeProps } from './types';
import styles from './CustomNode.module.css';

const CustomNode: React.FC<CustomNodeProps> = ({ data }) => (
  <div className={styles.nodeContainer} style={{ fontFamily: ThemingParameters.sapFontFamily }}>
    <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
    <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
    <div className={styles.nodeContent}>
      <div className={styles.statusIcon}>
        <StatusIcon status={data.status} />
      </div>
      <div className={styles.nodeTextContainer}>
        <div className={styles.nodeLabel} title={data.label}>
          {data.label}
        </div>
        {data.type && <div className={styles.nodeType}>{data.type}</div>}
      </div>
    </div>
    <div className={styles.yamlButtonWrapper}>
      <YamlViewButton resourceObject={data.item} smallerIcon={true} />
    </div>
  </div>
);

export default CustomNode;
