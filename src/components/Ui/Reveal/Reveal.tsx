import type { PropsWithChildren, ReactNode } from 'react';
import cx from 'clsx';
import styles from './Reveal.module.css';

interface RevealProps {
  isVisible: boolean;
  className?: string;
}

/**
 * Animates its children in (expand + fade in) and out (fade out + collapse) based on `isVisible`.
 * Children stay mounted across transitions so their state is preserved.
 */
export function Reveal({ isVisible, className, children }: PropsWithChildren<RevealProps>): ReactNode {
  return (
    <div className={cx(styles.wrapper, isVisible && styles.open)} aria-hidden={!isVisible} inert={!isVisible}>
      <div className={cx(styles.inner, className)}>{children}</div>
    </div>
  );
}
