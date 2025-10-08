import { FC, useRef, useState } from 'react';
import { Button, Menu, MenuItem, MenuDomRef } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import { ManagedResourceItem } from '../../lib/shared/types';
import type { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';
import type { Ui5CustomEvent, ButtonDomRef } from '@ui5/webcomponents-react';

interface RowActionsMenuProps {
  item: ManagedResourceItem;
  onOpen: (item: ManagedResourceItem) => void; // delete dialog open
  onEdit: (item: ManagedResourceItem) => void; // open YAML editor for patch
}

export const RowActionsMenu: FC<RowActionsMenuProps> = ({ item, onOpen, onEdit }) => {
  const { t } = useTranslation();
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
      <Button icon="overflow" design="Transparent" onClick={handleOpenerClick} />
      <Menu
        ref={popoverRef}
        open={open}
        onItemClick={(event) => {
          const element = event.detail.item as HTMLElement;
          const action = element.dataset.action;
          if (action === 'delete') {
            onOpen(item);
          } else if (action === 'edit') {
            onEdit(item);
          }
          setOpen(false);
        }}
      >
        <MenuItem text={t('ManagedResources.editAction', 'Edit')} icon="edit" data-action="edit" />
        <MenuItem text={t('ManagedResources.deleteAction')} icon="delete" data-action="delete" />
      </Menu>
    </>
  );
};
