import React, { ReactNode } from 'react';
import cx from 'clsx';
import { Icon } from '@ui5/webcomponents-react';

import styles from './Infobox.module.css';
import { useTheme } from '../../../hooks/useTheme';

interface LabelProps {
  id?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'normal' | 'success' | 'warning' | 'danger';
  children: ReactNode;
  fullWidth?: boolean;
  className?: string;
  icon?: string;
}

const variantIcons = {
  normal: 'message-information',
  success: 'message-success',
  warning: 'message-warning',
  danger: 'message-error',
};

export const Infobox: React.FC<LabelProps> = ({
  id,
  size = 'md',
  variant = 'normal',
  children,
  fullWidth = false,
  className,
  icon,
}) => {
  const infoboxClasses = cx(
    styles.infobox,
    {
      [styles['size-sm']]: size === 'sm',
      [styles['size-md']]: size === 'md',
      [styles['size-lg']]: size === 'lg',
      [styles['variant-normal']]: variant === 'normal',
      [styles['variant-success']]: variant === 'success',
      [styles['variant-warning']]: variant === 'warning',
      [styles['variant-danger']]: variant === 'danger',
      [styles['full-width']]: fullWidth,
    },
    className,
  );

  const iconName = icon || variantIcons[variant];

  return (
    <div className={infoboxClasses} id={id}>
      {iconName && <Icon name={iconName} className={styles.icon} />}
      <div className={styles.content}>{children}</div>
    </div>
  );
};
