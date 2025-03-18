
import React, { ReactNode } from 'react';

import styles from './Infobox.module.scss';

interface LabelProps {
  id?: string;

  size?: 'sm' | 'md' | 'lg';
  variant?: 'error' | 'normal';
  children: ReactNode;
}

export const Infobox: React.FC<LabelProps> = ({
  id,
  children,
}) => {



  return (
    <div
      className={styles.infobox}
      id={id}
    >
      {children}
    </div>
  );
};
