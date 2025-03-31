import { Button, ButtonProps } from '../Button/Button.tsx';
import clsx from 'clsx';

import classes from './Avatar.module.css';

export interface AvatarProps extends Omit<ButtonProps, 'children'> {
  initials?: string;
}

export function Avatar({ initials, className, ...rest }: AvatarProps) {
  return (
    <Button
      design="primary"
      className={clsx(classes.avatar, className)}
      {...rest}
    >
      {initials}
    </Button>
  );
}
