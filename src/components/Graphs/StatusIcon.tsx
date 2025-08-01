import React from 'react';
import { Icon } from '@ui5/webcomponents-react';

export interface StatusIconProps {
  status: string;
}

const StatusIcon: React.FC<StatusIconProps> = ({ status }) => {
  const isOk = status === 'OK';
  return (
    <Icon
      name={isOk ? 'sys-enter-2' : 'sys-cancel-2'}
      style={{
        color: isOk ? '#28a745' : '#dc3545',
        fontSize: '1rem',
        marginRight: 6,
      }}
    />
  );
};

export default StatusIcon;
