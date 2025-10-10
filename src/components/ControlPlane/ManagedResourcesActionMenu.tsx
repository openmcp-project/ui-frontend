import { FC, useRef, useState } from 'react';
import { Button, Menu, MenuItem, MenuDomRef } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import { ManagedResourceItem } from '../../lib/shared/types';
import type { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';
import type { Ui5CustomEvent, ButtonDomRef } from '@ui5/webcomponents-react';

interface RowActionsMenuProps {
  item: ManagedResourceItem;
  onOpen: (item: ManagedResourceItem) => void;
  onEdit: (item: ManagedResourceItem) => void;
}

export const RowActionsMenu: FC<RowActionsMenuProps> = ({ item, onOpen, onEdit }) => {
  const { t } = useTranslation();
  const popoverRef = useRef<MenuDomRef>(null);
  const [open, setOpen] = useState(false);

  // Determine if the resource is managed by Flux based on the presence of the Flux label

  const isFluxManaged = !!(item?.metadata?.labels as unknown as Record<string, unknown> | undefined)?.[
    'kustomize.toolkit.fluxcd.io/name'
  ];

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
          const element = event.detail.item as HTMLElement & { disabled?: boolean };
          const action = element.dataset.action;
          // If Edit is disabled (Flux-managed), ignore the click
          if (action === 'edit' && isFluxManaged) {
            return;
          }
          if (action === 'delete') {
            onOpen(item);
          } else if (action === 'edit') {
            onEdit(item);
          }
          setOpen(false);
        }}
      >
        <MenuItem
          text={t('ManagedResources.editAction', 'Edit')}
          icon="edit"
          data-action="edit"
          disabled={isFluxManaged}
        />
        <MenuItem text={t('ManagedResources.deleteAction')} icon="delete" data-action="delete" />
      </Menu>
    </>
  );
};
