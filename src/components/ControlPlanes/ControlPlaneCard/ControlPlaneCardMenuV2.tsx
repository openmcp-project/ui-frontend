import { Button, Menu, MenuItem } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/delete';
import '@ui5/webcomponents-icons/dist/edit';
import { Dispatch, FC, SetStateAction, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

type ControlPlaneCardMenuV2Props = {
  setDialogDeleteMcpIsOpen: Dispatch<SetStateAction<boolean>>;
  isDeleteMcpButtonDisabled: boolean;
  setIsEditManagedControlPlaneWizardOpen: Dispatch<SetStateAction<boolean>>;
};

export const ControlPlaneCardMenuV2: FC<ControlPlaneCardMenuV2Props> = ({
  setDialogDeleteMcpIsOpen,
  isDeleteMcpButtonDisabled,
  setIsEditManagedControlPlaneWizardOpen,
}) => {
  const openerId = useId();
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <Button
        id={openerId}
        icon="overflow"
        icon-end
        data-testid="ControlPlaneCardMenuV2-opener"
        onClick={() => setMenuIsOpen(true)}
      />
      <Menu
        open={menuIsOpen}
        opener={openerId}
        onItemClick={(event) => {
          if ((event.detail.item as HTMLElement).dataset.action === 'editMcp') {
            setIsEditManagedControlPlaneWizardOpen(true);
          }
          if ((event.detail.item as HTMLElement).dataset.action === 'deleteMcp') {
            setDialogDeleteMcpIsOpen(true);
          }
          setMenuIsOpen(false);
        }}
        onClose={() => setMenuIsOpen(false)}
      >
        <MenuItem text={t('ControlPlaneCard.editMCP')} data-action="editMcp" icon="edit" />
        <MenuItem
          text={t('ControlPlaneCard.deleteMCP')}
          data-action="deleteMcp"
          icon="delete"
          disabled={isDeleteMcpButtonDisabled}
        />
      </Menu>
    </>
  );
};
