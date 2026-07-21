import '@ui5/webcomponents-icons/dist/accept';
import '@ui5/webcomponents-icons/dist/copy';
import '@ui5/webcomponents-icons/dist/edit';
import { Button, ButtonDomRef, Menu, MenuDomRef, MenuItem, Ui5CustomEvent } from '@ui5/webcomponents-react';
import type { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';
import { Dispatch, FC, SetStateAction, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';
import { useFeatureToggle } from '../../context/FeatureToggleContext.tsx';
import { ManagedControlPlaneTemplate } from '../../lib/api/types/templates/mcpTemplate.ts';

type ControlPlanesListMenuProps = {
  setDialogDeleteWsIsOpen: Dispatch<SetStateAction<boolean>>;
  setDialogEditWsIsOpen: Dispatch<SetStateAction<boolean>>;
  setIsCreateManagedControlPlaneWizardOpen: Dispatch<SetStateAction<boolean>>;
  setIsCreateManagedControlPlaneWizardOpenV2: Dispatch<SetStateAction<boolean>>;
  setInitialTemplateName: Dispatch<SetStateAction<string | undefined>>;
};

export const ControlPlanesListMenu: FC<ControlPlanesListMenuProps> = ({
  setDialogDeleteWsIsOpen,
  setDialogEditWsIsOpen,
  setIsCreateManagedControlPlaneWizardOpen,
  setInitialTemplateName,
  setIsCreateManagedControlPlaneWizardOpenV2,
}) => {
  const popoverRef = useRef<MenuDomRef>(null);
  const [open, setOpen] = useState(false);

  const { t } = useTranslation();
  const { enableMcpV2, markMcpV1asDeprecated } = useFeatureToggle();

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
      <Button
        design="Transparent"
        icon="overflow"
        icon-end
        data-testid="ControlPlanesListMenu-opener"
        onClick={handleOpenerClick}
      />
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
          if (action === 'newManagedControlPlaneV2') {
            setIsCreateManagedControlPlaneWizardOpenV2(true);
          }
          if (action === 'newManagedControlPlaneWithTemplate') {
            const tplName = item.dataset.templateName || undefined;
            setInitialTemplateName(tplName);
            setIsCreateManagedControlPlaneWizardOpen(true);
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
        <MenuItem
          key={'add'}
          text={t('ControlPlaneListToolbar.createNewManagedControlPlane')}
          data-action="newManagedControlPlane"
          icon="add"
          additionalText={
            markMcpV1asDeprecated
              ? t('ControlPlaneListToolbar.deprecatedBadge')
              : t('ControlPlaneListToolbar.defaultBadge')
          }
        />
        {enableMcpV2 && (
          <MenuItem
            key={'addV2'}
            text={t('ControlPlaneListToolbar.createNewControlPlane')}
            data-action="newManagedControlPlaneV2"
            icon="add"
            additionalText={t('ControlPlaneListToolbar.previewV2Badge')}
          />
        )}
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
