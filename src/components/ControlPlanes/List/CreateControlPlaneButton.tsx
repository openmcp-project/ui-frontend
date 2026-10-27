import '@ui5/webcomponents-icons/dist/add';
import { Button, ButtonDomRef, Menu, MenuDomRef, MenuItem, Ui5CustomEvent } from '@ui5/webcomponents-react';
import type { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFeatureToggle } from '../../../context/FeatureToggleContext.tsx';

interface Props {
  disabled?: boolean;
  onCreateV1: () => void;
  onCreateV2?: () => void;
}

export function CreateControlPlaneButton({ disabled = false, onCreateV1, onCreateV2 }: Props) {
  const { t } = useTranslation();
  const { enableMcpV2, markMcpV1asDeprecated } = useFeatureToggle();
  const menuRef = useRef<MenuDomRef>(null);
  const [open, setOpen] = useState(false);

  const handleOpenerClick = (e: Ui5CustomEvent<ButtonDomRef, ButtonClickEventDetail>) => {
    if (menuRef.current && e.currentTarget) {
      menuRef.current.opener = e.currentTarget as HTMLElement;
      setOpen((prev) => !prev);
    }
  };

  if (!enableMcpV2) {
    return (
      <Button
        data-testid="create-control-plane-button"
        design="Emphasized"
        disabled={disabled}
        icon="add"
        onClick={onCreateV1}
      >
        {t('ControlPlaneListToolbar.createControlPlane')}
      </Button>
    );
  }

  return (
    <>
      <Button
        data-testid="create-control-plane-button"
        design="Emphasized"
        disabled={disabled}
        icon="add"
        icon-end
        onClick={handleOpenerClick}
      >
        {t('ControlPlaneListToolbar.createControlPlane')}
      </Button>
      <Menu
        ref={menuRef}
        open={open}
        onClose={() => setOpen(false)}
        onItemClick={(event) => {
          const action = (event.detail.item as HTMLElement).dataset.action;
          if (action === 'createV1') onCreateV1();
          if (action === 'createV2') onCreateV2?.();
          setOpen(false);
        }}
      >
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
        <MenuItem
          key="createV2"
          data-action="createV2"
          additionalText={t('ControlPlaneListToolbar.previewV2Badge')}
          icon="add"
          text={t('ControlPlaneListToolbar.createNewControlPlane')}
        />
      </Menu>
    </>
  );
}
