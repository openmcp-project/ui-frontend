import '@ui5/webcomponents-icons/dist/delete';
import '@ui5/webcomponents-icons/dist/edit';
import { Button, ButtonDomRef, Menu, MenuDomRef, MenuItem, Ui5CustomEvent } from '@ui5/webcomponents-react';
import type { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';
import { Dispatch, FC, SetStateAction, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

type ControlPlanesListMenuProps = {
  setDialogDeleteWsIsOpen: Dispatch<SetStateAction<boolean>>;
  setDialogEditWsIsOpen: Dispatch<SetStateAction<boolean>>;
  disabled?: boolean;
};

export const ControlPlanesListMenu: FC<ControlPlanesListMenuProps> = ({
  setDialogDeleteWsIsOpen,
  setDialogEditWsIsOpen,
  disabled = false,
}) => {
  const popoverRef = useRef<MenuDomRef>(null);
  const [open, setOpen] = useState(false);

  const { t } = useTranslation();

  const handleOpenerClick = (e: Ui5CustomEvent<ButtonDomRef, ButtonClickEventDetail>) => {
    if (popoverRef.current && e.currentTarget) {
      popoverRef.current.opener = e.currentTarget as HTMLElement;
      setOpen((prev) => !prev);
    }
  };

  return (
    <>
      <Button
        data-testid="ControlPlanesListMenu-opener"
        design="Transparent"
        disabled={disabled}
        icon="overflow"
        icon-end
        onClick={handleOpenerClick}
      />
      <Menu
        ref={popoverRef}
        open={open}
        onClose={() => setOpen(false)}
        onItemClick={(event) => {
          const item = event.detail.item as HTMLElement;
          const action = item.dataset.action;
          if (action === 'deleteWorkspace') {
            setDialogDeleteWsIsOpen(true);
          }
          if (action === 'editWorkspace') {
            setDialogEditWsIsOpen(true);
          }
          setOpen(false);
        }}
      >
        <MenuItem data-action="editWorkspace" icon="edit" text={t('ControlPlaneListToolbar.editWorkspace')} />
        <MenuItem data-action="deleteWorkspace" icon="delete" text={t('ControlPlaneListToolbar.deleteWorkspace')} />
      </Menu>
    </>
  );
};
