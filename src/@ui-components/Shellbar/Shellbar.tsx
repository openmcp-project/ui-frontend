import clsx from 'clsx';
import { ComponentProps, ReactNode } from 'react';
import classes from './Shellbar.module.css';

export interface ShellbarProps extends Omit<ComponentProps<'header'>, 'title'> {
  title: ReactNode;
  logoSrc: string;
  rightContent?: ReactNode;
}

export function Shellbar({
  title,
  logoSrc,
  rightContent,
  className,
  ...rest
}: ShellbarProps) {
  return (
    <header className={clsx(classes.header, className)} {...rest}>
      <div className={classes.inner}>
        <div className={classes.start}>
          <img className={classes.logo} src="/logo.png" alt="" />

          <span className={classes.title}>{title}</span>
        </div>

        <div className={classes.center} />

        <div className={classes.end}>{rightContent}</div>
      </div>
    </header>
  );
}
