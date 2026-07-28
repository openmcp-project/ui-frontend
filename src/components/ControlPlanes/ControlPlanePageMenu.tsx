import { Dispatch, FC, SetStateAction, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Menu, MenuItem } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/edit';
import { useTelemetry } from '../../lib/telemetry/telemetry.ts';

type ControlPlanesListMenuProps = {
  setIsEditManagedControlPlaneWizardOpen: Dispatch<SetStateAction<boolean>>;
};

export const ControlPlanePageMenu: FC<ControlPlanesListMenuProps> = ({ setIsEditManagedControlPlaneWizardOpen }) => {
  const openerId = useId();
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const { t } = useTranslation();
  const telemetry = useTelemetry();

  const handleOpenerClick = () => {
    setMenuIsOpen(true);
  };

  return (
    <>
      <Button id={openerId} design="Transparent" icon="overflow" icon-end onClick={handleOpenerClick} />
      <Menu
        open={menuIsOpen}
        opener={openerId}
        onItemClick={(event) => {
          const action = (event.detail.item as HTMLElement).dataset.action;
          if (action === 'editMcp') {
            telemetry.track({ name: 'controlplane.edited', source: 'v1-detail' });
            setIsEditManagedControlPlaneWizardOpen(true);
          }

          setMenuIsOpen(false);
        }}
        onClose={() => {
          setMenuIsOpen(false);
        }}
      >
        <MenuItem key={'edit'} text={t('ControlPlaneCard.editMCP')} data-action="editMcp" icon="edit" />
      </Menu>
    </>
  );
};
