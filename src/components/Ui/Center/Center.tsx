import type { PropsWithChildren, ReactNode, CSSProperties } from 'react';
import cx from 'clsx';
import styles from './Center.module.css';

export type CenterProps = PropsWithChildren<{
  className?: string;
  style?: CSSProperties;
  textAlignCenter?: boolean;
}>;

export const Center = ({ children, className, style, textAlignCenter = true }: CenterProps): ReactNode => {
  const classes = cx(styles.wrapper, { [styles.textAlignCenter]: textAlignCenter }, className);

  return (
    <div className={classes} style={style}>
      {children}
    </div>
  );
};
