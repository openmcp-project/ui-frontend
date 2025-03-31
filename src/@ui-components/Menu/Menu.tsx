import { MenuTrigger } from 'react-aria-components';

import { ReactNode } from 'react';

export interface MenuProps {
  /** Any button (e.g. `MenuButton` or `Button`) and `MenuList` */
  children: ReactNode;
}

export function Menu({ children }: MenuProps) {
  return <MenuTrigger>{children}</MenuTrigger>;
}
