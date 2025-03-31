import {
  Button as ButtonBase,
  ButtonProps as ButtonBaseProps,
} from 'react-aria-components';

import clsx from 'clsx';

import classes from './Button.module.css';

export interface ButtonProps extends ButtonBaseProps {
  design?: 'default' | 'primary';
}

export function Button({
  design = 'default',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <ButtonBase
      className={clsx(classes.button, className)}
      data-mcp-button-design={design}
      {...rest}
    >
      {children}
    </ButtonBase>
  );
}
