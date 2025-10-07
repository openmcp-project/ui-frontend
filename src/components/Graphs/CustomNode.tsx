import React from 'react';
import { Button, Icon, Label, ObjectStatus } from '@ui5/webcomponents-react';
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
    <div
      style={{
        backgroundColor: 'white',
        borderColor: status !== 'OK' ? 'var(--sapButton_Negative_Background)' : 'var(--sapPositiveElementColor)',
        borderWidth: '2px 2px 2px 8px',
        borderStyle: 'solid',
        borderRadius: '16px',
        padding: '1rem 1rem 0.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        pointerEvents: 'auto',
        color: 'var(--sapTextColor, #222)',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        gap: '0.5rem',
        boxShadow: '0 0 .125rem 0 rgba(34,53,72,.2), 0 .125rem .25rem 0 rgba(34,53,72,.2)',
      }}
    >
      <Handle type="target" position={Position.Top} className={styles.handleTop} />
      <Handle type="source" position={Position.Bottom} className={styles.handleBottom} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <span style={{ fontWeight: 'bold' }}>{label}</span>
        {type ? <Label>{type}</Label> : <Label>Kustomization</Label>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <ObjectStatus showDefaultIcon inverted={false} state={status === 'OK' ? 'Positive' : 'Negative'}>
            {status === 'OK' ? 'Ok' : 'Error'}
          </ObjectStatus>
        </div>
        <div>
          <Button design="Transparent" aria-label="YAML" title="YAML" onClick={onYamlClick}>
            <YamlText />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomNode;
