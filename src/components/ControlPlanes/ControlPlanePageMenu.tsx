import { Dispatch, FC, SetStateAction, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Menu, MenuItem } from '@ui5/webcomponents-react';

type ControlPlanesListMenuProps = {
  setIsEditManagedControlPlaneWizardOpen: Dispatch<SetStateAction<boolean>>;
};

export const ControlPlanePageMenu: FC<ControlPlanesListMenuProps> = ({ setIsEditManagedControlPlaneWizardOpen }) => {
  const buttonRef = useRef(null);
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const { t } = useTranslation();

  const handleOpenerClick = () => {
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
