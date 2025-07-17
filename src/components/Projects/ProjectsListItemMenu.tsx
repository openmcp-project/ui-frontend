import { Button, ButtonDomRef, Menu, MenuItem, Ui5CustomEvent, MenuDomRef } from '@ui5/webcomponents-react';
import type { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';
import { Dispatch, FC, SetStateAction, useRef, useState } from 'react';
import '@ui5/webcomponents-icons/dist/copy';
import '@ui5/webcomponents-icons/dist/accept';

import { useTranslation } from 'react-i18next';

type ProjectsListItemMenuProps = {
  setDialogDeleteProjectIsOpen: Dispatch<SetStateAction<boolean>>;
};

export const ProjectsListItemMenu: FC<ProjectsListItemMenuProps> = ({ setDialogDeleteProjectIsOpen }) => {
  const popoverRef = useRef<MenuDomRef>(null);
  const [open, setOpen] = useState(false);

  const { t } = useTranslation();

  const handleOpenerClick = (e: Ui5CustomEvent<ButtonDomRef, ButtonClickEventDetail>) => {
    if (popoverRef.current && e.currentTarget) {
      popoverRef.current.opener = e.currentTarget as HTMLElement;
      setOpen((prev) => !prev);
    }
  };

  return (
    <div>
      <Button icon="overflow" icon-end onClick={handleOpenerClick} />
      <Menu
        ref={popoverRef}
        open={open}
        onItemClick={(event) => {
          const action = (event.detail.item as HTMLElement).dataset.action;
          if (action === 'deleteProject') {
            setDialogDeleteProjectIsOpen(true);
          }

          setOpen(false);
        }}
      >
        <MenuItem key={'delete'} text={t('Project.deleteProject')} data-action="deleteProject" icon="delete" />
      </Menu>
    </div>
  );
};
