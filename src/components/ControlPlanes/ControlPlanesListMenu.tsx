import { Button, Menu, MenuItem } from '@ui5/webcomponents-react';

import { useRef, useState } from 'react';
import '@ui5/webcomponents-icons/dist/copy';
import '@ui5/webcomponents-icons/dist/accept';

import { useTranslation } from 'react-i18next';

export const ControlPlanesListMenu = () => {
  const popoverRef = useRef(null);
  const [open, setOpen] = useState(false);

  const { t } = useTranslation();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOpenerClick = (e: any) => {
    if (popoverRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ref = popoverRef.current as any;
      ref.opener = e.target;
      setOpen((prev) => !prev);
    }
  };

  return (
    <>
      <Button icon="overflow" icon-end onClick={handleOpenerClick}></Button>
      <Menu
        ref={popoverRef}
        open={open}
        onItemClick={(event) => {
          if (event.detail.item.dataset.action === 'newManagedControlPlane') {
          }
          if (event.detail.item.dataset.action === 'deleteWorkspace') {
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
