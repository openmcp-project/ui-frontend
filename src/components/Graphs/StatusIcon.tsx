import React from 'react';
import { Icon } from '@ui5/webcomponents-react';
import styles from './StatusIcon.module.css';

export interface StatusIconProps {
  isOk: boolean;
}

const StatusIcon: React.FC<StatusIconProps> = ({ isOk }) => (
  <Icon
    name={isOk ? 'sys-enter-2' : 'sys-cancel-2'}
    design={isOk ? 'Positive' : 'Negative'}
    className={styles.statusIcon}
  />
);

export default StatusIcon;
