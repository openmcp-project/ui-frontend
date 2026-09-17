import '@ui5/webcomponents-icons/dist/accept';
import '@ui5/webcomponents-icons/dist/copy';
import '@ui5/webcomponents-icons/dist/edit';
import { Button, ButtonDomRef, Menu, MenuDomRef, MenuItem, Ui5CustomEvent } from '@ui5/webcomponents-react';
import type { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';
import { Dispatch, FC, SetStateAction, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';
import { useFeatureToggle } from '../../context/FeatureToggleContext.tsx';

type ControlPlanesListMenuProps = {
  setDialogDeleteWsIsOpen: Dispatch<SetStateAction<boolean>>;
  setDialogEditWsIsOpen: Dispatch<SetStateAction<boolean>>;
  setIsCreateManagedControlPlaneWizardOpenV2: Dispatch<SetStateAction<boolean>>;
  disabled?: boolean;
};

export const ControlPlanesListMenu: FC<ControlPlanesListMenuProps> = ({
  setDialogDeleteWsIsOpen,
  setDialogEditWsIsOpen,
  setIsCreateManagedControlPlaneWizardOpenV2,
  disabled = false,
}) => {
  const popoverRef = useRef<MenuDomRef>(null);
  const [open, setOpen] = useState(false);

  const { t } = useTranslation();
  const { enableMcpV2 } = useFeatureToggle();

  const handleOpenerClick = (e: Ui5CustomEvent<ButtonDomRef, ButtonClickEventDetail>) => {
    if (popoverRef.current && e.currentTarget) {
      popoverRef.current.opener = e.currentTarget as HTMLElement;
      setOpen((prev) => !prev);
    }
  };

  return (
    <>
      <Button
        design="Transparent"
        icon="overflow"
        icon-end
        data-testid="ControlPlanesListMenu-opener"
        disabled={disabled}
        onClick={handleOpenerClick}
      />
      <Menu
        ref={popoverRef}
        open={open}
        onItemClick={(event) => {
          const item = event.detail.item as HTMLElement;
          const action = item.dataset.action;
          if (action === 'newManagedControlPlaneV2') {
            setIsCreateManagedControlPlaneWizardOpenV2(true);
          }
          if (action === 'deleteWorkspace') {
            setDialogDeleteWsIsOpen(true);
          }
          if (action === 'editWorkspace') {
            setDialogEditWsIsOpen(true);
          }
          setOpen(false);
        }}
      >
        {enableMcpV2 && (
          <MenuItem
            key={'addV2'}
            text={t('ControlPlaneListToolbar.createNewControlPlane')}
            data-action="newManagedControlPlaneV2"
            icon="add"
            additionalText={t('ControlPlaneListToolbar.previewV2Badge')}
          />
        )}
        <MenuItem
          key={'edit'}
          text={t('ControlPlaneListToolbar.editWorkspace')}
          data-action="editWorkspace"
          icon="edit"
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
