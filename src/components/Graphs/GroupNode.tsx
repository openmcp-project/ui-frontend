import React from 'react';
import { Button, Icon, Label, ObjectStatus, Title } from '@ui5/webcomponents-react';
import { ResourceStatusCell } from '../Shared/ResourceStatusCell.tsx';
import styles from './CustomNode.module.css';
import { Handle, Position } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import { YamlText } from '../Yaml/YamlText.tsx';

export interface GroupNodeProps {
  label: string;
  type?: string;
  status: string;
  transitionTime?: string;
  statusMessage?: string;
  onYamlClick: () => void;
}

const GroupNode: React.FC<GroupNodeProps> = (props) => {
  return (
    <div
      style={{
        border: '2px solid #cccccc',
        width: '100%',
        height: '100%',
        borderRadius: '16px',
        zIndex: '-99',
        backgroundColor: 'rgba(100,150,240,0.08)', // optional: semi-transparent
        boxShadow: '0 0 .125rem 0 rgba(34,53,72,.2), 0 .125rem .25rem 0 rgba(34,53,72,.2)',
      }}
    >
      <div style={{ margin: '32px' }}>
        <Title size="H4">{props.label}</Title>
      </div>
    </div>
  );
};

export default GroupNode;
