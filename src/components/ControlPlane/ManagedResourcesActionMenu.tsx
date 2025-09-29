import { FC, useRef } from 'react';
import { Button, Menu, MenuItem, MenuDomRef } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import { ManagedResourceItem } from '../../lib/shared/types';

interface RowActionsMenuProps {
  item: ManagedResourceItem;
  onOpen: (item: ManagedResourceItem) => void;
  isDeleting: boolean;
}

export const RowActionsMenu: FC<RowActionsMenuProps> = ({ item, onOpen, isDeleting }) => {
  const { t } = useTranslation();
  const popoverRef = useRef<MenuDomRef>(null);

  return (
    <>
      <Button icon="overflow" icon-end disabled={isDeleting} onClick={() => onOpen(item)} />
      <Menu
        ref={popoverRef}
        onItemClick={() => {
          onOpen(item);
        }}
      >
        <MenuItem text={t('ManagedResources.deleteAction')} icon="delete" />
      </Menu>
    </>
  );
};
