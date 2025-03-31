import {
  MenuItem as MenuItemBase,
  MenuItemProps as MenuItemPropsBase,
} from 'react-aria-components';

import classes from './MenuItem.module.css';

export interface MenuItemProps extends MenuItemPropsBase {}

export function MenuItem({
  textValue: passedTextValue,
  children,
  ...rest
}: MenuItemProps) {
  const textValue =
    passedTextValue || (typeof children === 'string' ? children : undefined);
  return (
    <MenuItemBase className={classes.menuItem} {...rest} textValue={textValue}>
      {children}
    </MenuItemBase>
  );
}
