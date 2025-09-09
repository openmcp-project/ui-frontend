import { Button, ButtonDomRef, Menu, MenuItem, Ui5CustomEvent } from '@ui5/webcomponents-react';
import type { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';
import { Dispatch, FC, SetStateAction, useRef, useState } from 'react';
import '@ui5/webcomponents-icons/dist/copy';
import '@ui5/webcomponents-icons/dist/accept';

import { useTranslation } from 'react-i18next';

type ControlPlanesListMenuProps = {
  setDialogDeleteMcpIsOpen: Dispatch<SetStateAction<boolean>>;
  isDeleteMcpButtonDisabled: boolean;
  // setIsCreateManagedControlPlaneWizardOpen: Dispatch<SetStateAction<boolean>>;
};

export const ControlPlaneCardMenu: FC<ControlPlanesListMenuProps> = ({
  setDialogDeleteMcpIsOpen,
  isDeleteMcpButtonDisabled,
  // setIsCreateManagedControlPlaneWizardOpen,
}) => {
  // const popoverRef = useRef<MenuDomRef>(null);

  const buttonRef = useRef(null);
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const { t } = useTranslation();

  const handleOpenerClick = (e: Ui5CustomEvent<ButtonDomRef, ButtonClickEventDetail>) => {
    setMenuIsOpen(true);
  };

  return (
    <>
      <Button ref={buttonRef} icon="overflow" icon-end onClick={handleOpenerClick} />
      <Menu
        open={menuIsOpen}
        opener={buttonRef.current}
        onItemClick={(event) => {
          const action = (event.detail.item as HTMLElement).dataset.action;
          if (action === 'editMcp') {
            // setIsCreateManagedControlPlaneWizardOpen(true);
          }
          if (action === 'deleteMcp') {
            setDialogDeleteMcpIsOpen(true);
          }

          setMenuIsOpen(false);
        }}
        onClose={() => {
          setMenuIsOpen(false);
        }}
      >
        {/*<MenuItem*/}
        {/*  key={'add'}*/}
        {/*  text={t('ControlPlaneListToolbar.createNewManagedControlPlane')}*/}
        {/*  data-action="newManagedControlPlane"*/}
        {/*  icon="add"*/}
        {/*/>*/}
        <MenuItem
          key={'delete'}
          text={t('ControlPlaneCard.deleteMCP')}
          data-action="deleteMcp"
          icon="delete"
          disabled={isDeleteMcpButtonDisabled}
        />
        <MenuItem
          key={'edit'}
          text={t('ControlPlaneCard.editMCP')}
          data-action="editMcp"
          icon="edit"
          disabled={isDeleteMcpButtonDisabled}
        />
      </Menu>
    </>
  );
};
