import { Button, Menu, MenuItem } from '@ui5/webcomponents-react';

import { Dispatch, FC, SetStateAction, useRef, useState } from 'react';
import '@ui5/webcomponents-icons/dist/copy';
import '@ui5/webcomponents-icons/dist/accept';

import { useTranslation } from 'react-i18next';

type ControlPlanesListMenuProps = {
  setDialogDeleteMcpIsOpen: Dispatch<SetStateAction<boolean>>;
  isDeleteMcpButtonDisabled: boolean;
  setIsEditManagedControlPlaneWizardOpen: (isOpen: boolean, mode?: 'edit' | 'duplicate') => void;
};

export const ControlPlaneCardMenu: FC<ControlPlanesListMenuProps> = ({
  setDialogDeleteMcpIsOpen,
  isDeleteMcpButtonDisabled,
  setIsEditManagedControlPlaneWizardOpen,
}) => {
  const buttonRef = useRef(null);
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const { t } = useTranslation();

  const handleOpenerClick = () => {
    setMenuIsOpen(true);
  };

  return (
    <>
      <Button
        ref={buttonRef}
        icon="overflow"
        icon-end
        data-testid="ControlPlaneCardMenu-opener"
        onClick={handleOpenerClick}
      />
      <Menu
        open={menuIsOpen}
        opener={buttonRef.current}
        onItemClick={(event) => {
          const action = (event.detail.item as HTMLElement).dataset.action;
          if (action === 'editMcp') {
            setIsEditManagedControlPlaneWizardOpen(true, 'edit');
          }
          if (action === 'duplicateMcp') {
            setIsEditManagedControlPlaneWizardOpen(true, 'duplicate');
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
        <MenuItem
          key={'delete'}
          text={t('ControlPlaneCard.deleteMCP')}
          data-action="deleteMcp"
          icon="delete"
          disabled={isDeleteMcpButtonDisabled}
        />
        <MenuItem key={'duplicate'} text={t('ControlPlaneCard.duplicateMCP')} data-action="duplicateMcp" icon="copy" />
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
