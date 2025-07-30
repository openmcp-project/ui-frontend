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
      <StatusIcon status={data.status} />
      <div className={styles.nodeTextContainer}>
        <div className={styles.nodeLabel} title={data.label}>
          {data.label}
        </div>
        {data.type && <div>{data.type}</div>}
      </div>
    </div>
    <div className={styles.yamlButtonWrapper}>
      <YamlViewButton resourceObject={data.item} />
    </div>
  </div>
);

export default CustomNode;
