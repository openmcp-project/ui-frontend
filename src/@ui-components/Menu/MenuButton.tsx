import { Button, ButtonProps } from '../Button/Button.tsx';
import { Icon } from '../Icon/Icon.tsx';
import { ReactNode } from 'react';
import clsx from 'clsx';

import classes from './MenuButton.module.css';

export interface MenuButtonProps extends Omit<ButtonProps, 'children'> {
  children?: ReactNode;
}

export function MenuButton({ className, children, ...rest }: MenuButtonProps) {
  return (
    <Button
      className={clsx(classes.menuButton, className)}
      aria-label="Menu"
      {...rest}
    >
      <div className={classes.inner}>
        <Icon src="navigation-down-arrow" className={classes.icon} />
        {children}
      </div>
    </Button>
  );
}
