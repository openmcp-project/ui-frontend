import {
  Button,
  ButtonDomRef,
  Menu,
  MenuItem,
  Ui5CustomEvent,
  MenuDomRef,
} from '@ui5/webcomponents-react';
import type { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';
import { Dispatch, FC, SetStateAction, useRef, useState } from 'react';
import '@ui5/webcomponents-icons/dist/copy';
import '@ui5/webcomponents-icons/dist/accept';

import { useTranslation } from 'react-i18next';

type ControlPlanesListMenuProps = {
  setDialogDeleteWsIsOpen: Dispatch<SetStateAction<boolean>>;
  setIsCreateManagedControlPlaneWizardOpen: Dispatch<SetStateAction<boolean>>;
  setIsCreateManagedControlPlaneWizardForTemplate: Dispatch<
    SetStateAction<boolean>
  >;
};

export const ControlPlanesListMenu: FC<ControlPlanesListMenuProps> = ({
  setDialogDeleteWsIsOpen,
  setIsCreateManagedControlPlaneWizardOpen,
  setIsCreateManagedControlPlaneWizardForTemplate,
}) => {
  const popoverRef = useRef<MenuDomRef>(null);
  const [open, setOpen] = useState(false);

  const { t } = useTranslation();

  const handleOpenerClick = (
    e: Ui5CustomEvent<ButtonDomRef, ButtonClickEventDetail>,
  ) => {
    if (popoverRef.current && e.currentTarget) {
      popoverRef.current.opener = e.currentTarget as HTMLElement;
      setOpen((prev) => !prev);
    }
  };

  return (
    <>
      <Button icon="overflow" icon-end onClick={handleOpenerClick} />
      <Menu
        ref={popoverRef}
        open={open}
        onItemClick={(event) => {
          const action = (event.detail.item as HTMLElement).dataset.action;
          if (action === 'newManagedControlPlane') {
            setIsCreateManagedControlPlaneWizardOpen(true);
          }
          if (action === 'newManagedControlPlaneWithTemplate') {
            setIsCreateManagedControlPlaneWizardOpen(true);
            setIsCreateManagedControlPlaneWizardForTemplate(true);
          }
          if (action === 'deleteWorkspace') {
            setDialogDeleteWsIsOpen(true);
          }

          setOpen(false);
        }}
      >
        <MenuItem
          key={'add'}
          text={t('ControlPlaneListToolbar.createNewManagedControlPlane')}
          data-action="newManagedControlPlane"
          icon="add"
        />
        <MenuItem
          key={'add'}
          text={t(
            'ControlPlaneListToolbar.createNewManagedControlPlaneWithTemplate',
          )}
          data-action="newManagedControlPlaneWithTemplate"
          icon="add-document"
        />
        <MenuItem
          key={'delete'}
          text={t('ControlPlaneListToolbar.deleteWorkspace')}
          data-action="deleteWorkspace"
          icon="delete"
        />
      </Menu>
    </>
  );
};
