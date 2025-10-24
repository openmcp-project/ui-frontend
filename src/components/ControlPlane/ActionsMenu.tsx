import { useRef, useState } from 'react';
import { Button, Menu, MenuItem, MenuDomRef } from '@ui5/webcomponents-react';
import type { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';
import type { Ui5CustomEvent, ButtonDomRef } from '@ui5/webcomponents-react';
import tooltipCell from '../Shared/TooltipCell.tsx';

export type ActionItem<T> = {
  key: string;
  text: string;
  icon?: string;
  disabled?: boolean;
  onClick: (item: T) => void;
  tooltip?: string;
};

export type ActionsMenuProps<T> = {
  item: T;
  actions: ActionItem<T>[];
  buttonIcon?: string;
};

export function ActionsMenu<T>({ item, actions, buttonIcon = 'overflow' }: ActionsMenuProps<T>) {
  const popoverRef = useRef<MenuDomRef>(null);
  const [open, setOpen] = useState(false);

  const handleOpenerClick = (e: Ui5CustomEvent<ButtonDomRef, ButtonClickEventDetail>) => {
    if (popoverRef.current && e.currentTarget) {
      popoverRef.current.opener = e.currentTarget as unknown as HTMLElement;
      setOpen((prev) => !prev);
    }
  };

  return (
    <>
      <Button icon={buttonIcon} design="Transparent" onClick={handleOpenerClick} />
      <Menu
        ref={popoverRef}
        open={open}
        onItemClick={(event) => {
          const element = event.detail.item as HTMLElement & { disabled?: boolean };
          const actionKey = element.dataset.actionKey;
          const action = actions.find((a) => a.key === actionKey);
          if (action && !action.disabled) {
            action.onClick(item);
          }
          setOpen(false);
        }}
      >
        {actions.map((a) => (
          <MenuItem
            key={a.key}
            text={a.text}
            icon={a.icon}
            data-action-key={a.key}
            disabled={a.disabled}
            tooltip={a.tooltip}
          />
        ))}
      </Menu>
    </>
  );
}
