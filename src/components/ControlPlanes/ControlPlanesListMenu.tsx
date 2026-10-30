import '@ui5/webcomponents-icons/dist/add';
import '@ui5/webcomponents-icons/dist/delete';
import '@ui5/webcomponents-icons/dist/edit';
import { Button, ButtonDomRef, Menu, MenuDomRef, MenuItem, Ui5CustomEvent } from '@ui5/webcomponents-react';
import type { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';
import { Dispatch, FC, SetStateAction, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFeatureToggle } from '../../context/FeatureToggleContext.tsx';

type ControlPlanesListMenuProps = {
  setDialogDeleteWsIsOpen: Dispatch<SetStateAction<boolean>>;
  setDialogEditWsIsOpen: Dispatch<SetStateAction<boolean>>;
  disabled?: boolean;
  showCreateActions?: boolean;
  onCreateV1?: () => void;
  onCreateV2?: () => void;
};

export const ControlPlanesListMenu: FC<ControlPlanesListMenuProps> = ({
  setDialogDeleteWsIsOpen,
  setDialogEditWsIsOpen,
  disabled = false,
  showCreateActions = false,
  onCreateV1,
  onCreateV2,
}) => {
  const popoverRef = useRef<MenuDomRef>(null);
  const [open, setOpen] = useState(false);

  const { t } = useTranslation();
  const { enableMcpV2, markMcpV1asDeprecated } = useFeatureToggle();

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
          if (action === 'createV1') onCreateV1?.();
          if (action === 'createV2') onCreateV2?.();
          if (action === 'deleteWorkspace') {
            setDialogDeleteWsIsOpen(true);
          }
          if (action === 'editWorkspace') {
            setDialogEditWsIsOpen(true);
          }
          setOpen(false);
        }}
      >
        {showCreateActions && (
          <MenuItem
            key="createV1"
            data-action="createV1"
            additionalText={
              markMcpV1asDeprecated
                ? t('ControlPlaneListToolbar.deprecatedBadge')
                : t('ControlPlaneListToolbar.defaultBadge')
            }
            icon="add"
            text={t('ControlPlaneListToolbar.createNewManagedControlPlane')}
          />
        )}
        {showCreateActions && enableMcpV2 && (
          <MenuItem
            key="createV2"
            data-action="createV2"
            additionalText={t('ControlPlaneListToolbar.previewV2Badge')}
            icon="add"
            text={t('ControlPlaneListToolbar.createNewControlPlane')}
          />
        )}
        <MenuItem data-action="editWorkspace" icon="edit" text={t('ControlPlaneListToolbar.editWorkspace')} />
        <MenuItem data-action="deleteWorkspace" icon="delete" text={t('ControlPlaneListToolbar.deleteWorkspace')} />
      </Menu>
    </>
  );
};
