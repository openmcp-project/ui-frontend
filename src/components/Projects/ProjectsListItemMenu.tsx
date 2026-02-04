import { Button, ButtonDomRef, Menu, MenuItem, Ui5CustomEvent, MenuDomRef } from '@ui5/webcomponents-react';
import type { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';
import { FC, useRef, useState } from 'react';
import '@ui5/webcomponents-icons/dist/copy';
import '@ui5/webcomponents-icons/dist/accept';

import { useTranslation } from 'react-i18next';
import { DeleteConfirmationDialog } from '../Dialogs/DeleteConfirmationDialog.tsx';

import { useDeleteProject as _useDeleteProject } from '../../hooks/useDeleteProject.ts';
import { KubectlDeleteProjectDialog } from '../Dialogs/KubectlCommandInfo/KubectlDeleteProjectDialog.tsx';

type ProjectsListItemMenuProps = {
  projectName: string;
  useDeleteProject?: typeof _useDeleteProject;
};

export const ProjectsListItemMenu: FC<ProjectsListItemMenuProps> = ({
  projectName,
  useDeleteProject = _useDeleteProject,
}) => {
  const popoverRef = useRef<MenuDomRef>(null);
  const [open, setOpen] = useState(false);
  const [dialogDeleteProjectIsOpen, setDialogDeleteProjectIsOpen] = useState(false);
  const { t } = useTranslation();

  const { deleteProject } = useDeleteProject(projectName);

  const handleOpenerClick = (e: Ui5CustomEvent<ButtonDomRef, ButtonClickEventDetail>) => {
    e.stopImmediatePropagation();
    e.stopPropagation();
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
          event.stopImmediatePropagation();
          event.stopPropagation();
          const action = (event.detail.item as HTMLElement).dataset.action;
          if (action === 'deleteProject') {
            setDialogDeleteProjectIsOpen(true);
          }

          setOpen(false);
        }}
      >
        <MenuItem key={'delete'} text={t('ProjectsListView.deleteProject')} data-action="deleteProject" icon="delete" />
      </Menu>

      {dialogDeleteProjectIsOpen && (
        <DeleteConfirmationDialog
          resourceName={projectName}
          kubectlDialog={({ isOpen, onClose }) => (
            <KubectlDeleteProjectDialog projectName={projectName} isOpen={isOpen} onClose={onClose} />
          )}
          isOpen={dialogDeleteProjectIsOpen}
          setIsOpen={setDialogDeleteProjectIsOpen}
          onDeletionConfirmed={deleteProject}
        />
      )}
    </div>
  );
};
