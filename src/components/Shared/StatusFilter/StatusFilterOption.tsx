import React from 'react';
import { Option, Icon } from '@ui5/webcomponents-react';
import styles from './StatusFilterOption.module.css';

export interface StatusFilterOptionProps {
  value: string;
  iconName: string;
  color: string;
  labelKey: string;
  t: (key: string) => string;
  isSelected: boolean;
}

const RenderOption: React.FC<StatusFilterOptionProps> = ({ value, iconName, color, labelKey, t, isSelected }) => (
  <Option key={value} data-value={value} selected={isSelected} className={styles.option}>
    <div className={styles.container}>
      <Icon name={iconName} style={{ color }} className={styles.icon} />
      <span className={styles.label}>{t(labelKey)}</span>
    </div>
  </Option>
);

export default RenderOption;
