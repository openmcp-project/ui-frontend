import { Dispatch, FC, SetStateAction, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Menu, MenuItem } from '@ui5/webcomponents-react';

type ControlPlanesListMenuProps = {
  setIsEditManagedControlPlaneWizardOpen: Dispatch<SetStateAction<boolean>>;
  onYamlClick?: () => void;
};

export const ControlPlanePageMenu: FC<ControlPlanesListMenuProps> = ({
  setIsEditManagedControlPlaneWizardOpen,
  onYamlClick,
}) => {
  const openerId = useId();
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const { t } = useTranslation();

  const handleOpenerClick = () => {
    setMenuIsOpen(true);
  };

  return (
    <>
      <Button id={openerId} icon="overflow" icon-end onClick={handleOpenerClick} />
      <Menu
        open={menuIsOpen}
        opener={openerId}
        onItemClick={(event) => {
          const action = (event.detail.item as HTMLElement).dataset.action;
          if (action === 'editMcp') {
            setIsEditManagedControlPlaneWizardOpen(true);
          } else if (action === 'yaml' && onYamlClick) {
            onYamlClick();
          }

          setMenuIsOpen(false);
        }}
        onClose={() => {
          setMenuIsOpen(false);
        }}
      >
        <MenuItem key={'edit'} text={t('ControlPlaneCard.editMCP')} data-action="editMcp" icon="edit" />
        {onYamlClick && <MenuItem key={'yaml'} text={t('yaml.showYAML')} data-action="yaml" />}
      </Menu>
    </>
  );
};
