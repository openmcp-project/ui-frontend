import {
  Popover as PopoverBase,
  PopoverProps as PopoverBaseProps,
} from 'react-aria-components';

import clsx from 'clsx';

import classes from './Popover.module.css';

export interface PopoverProps extends PopoverBaseProps {}

export function Popover({ className, children, ...rest }: PopoverProps) {
  return (
    <PopoverBase className={clsx(classes.popover, className)} {...rest}>
      {children}
    </PopoverBase>
  );
}
