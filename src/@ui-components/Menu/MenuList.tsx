import {
  Menu as BaseMenu,
  MenuProps as BaseMenuProps,
} from 'react-aria-components';

import { Popover } from '../Popover/Popover.tsx';

import classes from './MenuList.module.css';

export interface MenuListProps<T> extends BaseMenuProps<T> {}

export function MenuList<T extends object>({
  className,
  children,
  ...rest
}: MenuListProps<T>) {
  return (
    <Popover offset={2}>
      <BaseMenu className={classes.menuList} {...rest}>
        {children}
      </BaseMenu>
    </Popover>
  );
}
