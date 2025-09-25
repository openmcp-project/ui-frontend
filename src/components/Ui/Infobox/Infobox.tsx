import React, { ReactNode } from 'react';
import cx from 'clsx';
import { Icon } from '@ui5/webcomponents-react';

import styles from './Infobox.module.css';

interface LabelProps {
  id?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'normal' | 'success' | 'warning' | 'danger';
  children: ReactNode;
  fullWidth?: boolean;
  className?: string;
  icon?: string;
}

export const Infobox: React.FC<LabelProps> = ({
  id,
  size = 'md', // Default to medium size
  variant = 'normal', // Default to normal variant
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

  return (
    <div className={infoboxClasses} id={id}>
      {icon && <Icon name={icon} className={styles.icon} />}
      <div className={styles.content}>{children}</div>
    </div>
  );
};
