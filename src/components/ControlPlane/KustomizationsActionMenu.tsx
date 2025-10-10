import { FC, useRef, useState } from 'react';
import { Button, Menu, MenuItem, MenuDomRef } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import type { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';
import type { Ui5CustomEvent, ButtonDomRef } from '@ui5/webcomponents-react';
import type { KustomizationsResponse } from '../../lib/api/types/flux/listKustomization';

export type KustomizationItem = KustomizationsResponse['items'][0] & {
  apiVersion?: string;
  metadata: KustomizationsResponse['items'][0]['metadata'] & { namespace?: string };
};

interface KustomizationsRowActionsMenuProps {
  item: KustomizationItem;
  onEdit: (item: KustomizationItem) => void;
}

export const KustomizationsRowActionsMenu: FC<KustomizationsRowActionsMenuProps> = ({ item, onEdit }) => {
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
          if (action === 'edit') {
            onEdit(item);
          }
          setOpen(false);
        }}
      >
        <MenuItem text={t('ManagedResources.editAction', 'Edit')} icon="edit" data-action="edit" />
      </Menu>
    </>
  );
};
