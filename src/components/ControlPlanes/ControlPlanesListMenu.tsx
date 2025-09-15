import { Button, ButtonDomRef, Menu, MenuItem, Ui5CustomEvent, MenuDomRef } from '@ui5/webcomponents-react';
import type { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';
import { Dispatch, FC, SetStateAction, useRef, useState } from 'react';
import '@ui5/webcomponents-icons/dist/copy';
import '@ui5/webcomponents-icons/dist/accept';

import { useTranslation } from 'react-i18next';
import { ManagedControlPlaneTemplate } from '../../lib/api/types/templates/mcpTemplate.ts';

type ControlPlanesListMenuProps = {
  setDialogDeleteWsIsOpen: Dispatch<SetStateAction<boolean>>;
  setIsCreateManagedControlPlaneWizardOpen: Dispatch<SetStateAction<boolean>>;
  setInitialTemplateName: Dispatch<SetStateAction<string | undefined>>;
};

export const ControlPlanesListMenu: FC<ControlPlanesListMenuProps> = ({
  setDialogDeleteWsIsOpen,
  setIsCreateManagedControlPlaneWizardOpen,
  setInitialTemplateName,
}) => {
  const popoverRef = useRef<MenuDomRef>(null);
  const [open, setOpen] = useState(false);

  const { t } = useTranslation();

  // Here we will pass template list from OnboardingAPI
  const allTemplates: ManagedControlPlaneTemplate[] = [];

  const handleOpenerClick = (e: Ui5CustomEvent<ButtonDomRef, ButtonClickEventDetail>) => {
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
          const item = event.detail.item as HTMLElement;
          const action = item.dataset.action;
          if (action === 'newManagedControlPlane') {
            setInitialTemplateName(undefined);
            setIsCreateManagedControlPlaneWizardOpen(true);
          }
          if (action === 'newManagedControlPlaneWithTemplate') {
            const tplName = item.dataset.templateName || undefined;
            setInitialTemplateName(tplName);
            setIsCreateManagedControlPlaneWizardOpen(true);
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
        {allTemplates.map((tpl) => (
          <MenuItem
            key={`tpl-${tpl.metadata.name}`}
            text={tpl.metadata.name}
            title={tpl.metadata.descriptionText || ''}
            data-action="newManagedControlPlaneWithTemplate"
            data-template-name={tpl.metadata.name}
            icon="document-text"
          />
        ))}

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
