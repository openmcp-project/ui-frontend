import { Button, ButtonDomRef, Menu, MenuItem, Ui5CustomEvent, MenuDomRef } from '@ui5/webcomponents-react';
import type { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';
import { FC, useRef, useState } from 'react';
import '@ui5/webcomponents-icons/dist/copy';
import '@ui5/webcomponents-icons/dist/accept';
import '@ui5/webcomponents-icons/dist/edit';

import { useTranslation } from 'react-i18next';
import { DeleteConfirmationDialog } from '../Dialogs/DeleteConfirmationDialog.tsx';
import { EditProjectDialogContainer } from '../Dialogs/EditProjectDialogContainer.tsx';

import { useDeleteProject as _useDeleteProject } from '../../spaces/onboarding/hooks/useDeleteProject.ts';
import { useUpdateProject as _useUpdateProject } from '../../spaces/onboarding/hooks/useUpdateProject.ts';
import { useGetProject as _useGetProject } from '../../spaces/onboarding/hooks/useGetProject.ts';
import { KubectlDeleteProjectDialog } from '../Dialogs/KubectlCommandInfo/KubectlDeleteProjectDialog.tsx';
import { useTelemetry } from '../../lib/telemetry/telemetry.ts';

type ProjectsListItemMenuProps = {
  projectName: string;
  useDeleteProject?: typeof _useDeleteProject;
  useUpdateProject?: typeof _useUpdateProject;
  useGetProject?: typeof _useGetProject;
};

export const ProjectsListItemMenu: FC<ProjectsListItemMenuProps> = ({
  projectName,
  useDeleteProject = _useDeleteProject,
  useUpdateProject = _useUpdateProject,
  useGetProject = _useGetProject,
}) => {
  const popoverRef = useRef<MenuDomRef>(null);
  const [open, setOpen] = useState(false);
  const [dialogDeleteProjectIsOpen, setDialogDeleteProjectIsOpen] = useState(false);
  const [dialogEditProjectIsOpen, setDialogEditProjectIsOpen] = useState(false);
  const { t } = useTranslation();
  const telemetry = useTelemetry();

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
      <Button design="Transparent" icon="overflow" icon-end onClick={handleOpenerClick} />
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
          if (action === 'editProject') {
            setDialogEditProjectIsOpen(true);
          }

          setOpen(false);
        }}
      >
        <MenuItem key={'edit'} text={t('ProjectsListView.editProject')} data-action="editProject" icon="edit" />
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
          onDeletionConfirmed={async () => {
            telemetry.track({ name: 'project.deleted' });
            await deleteProject();
          }}
        />
      )}
      <EditProjectDialogContainer
        isOpen={dialogEditProjectIsOpen}
        setIsOpen={setDialogEditProjectIsOpen}
        projectName={projectName}
        useUpdateProject={useUpdateProject}
        useGetProject={useGetProject}
      />
    </div>
  );
};
