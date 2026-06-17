import type { PropsWithChildren, ReactNode, CSSProperties } from 'react';
import cx from 'clsx';
import styles from './FadeIn.module.css';

export type FadeInProps = PropsWithChildren<{
  className?: string;
  style?: CSSProperties;
}>;

export const FadeIn = ({ children, className, style }: FadeInProps): ReactNode => (
  <span className={cx(styles.fadeIn, className)} style={style}>
    {children}
  </span>
);
