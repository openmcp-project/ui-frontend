import '@ui5/webcomponents-icons/dist/delete';
import '@ui5/webcomponents-icons/dist/edit';
import '@ui5/webcomponents-icons/dist/overflow';
import { Button, Menu, MenuItem, Toolbar, ToolbarButton } from '@ui5/webcomponents-react';
import styles from './ControlPlaneListToolbar.module.css';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate as _useNavigate } from 'react-router-dom';
import { Routes } from '../../../Routes.ts';
import { useDeleteProject as _useDeleteProject } from '../../../spaces/onboarding/hooks/useDeleteProject.ts';
import { CreateWorkspaceDialogContainer } from '../../Dialogs/CreateWorkspaceDialogContainer.tsx';
import { DeleteConfirmationDialog } from '../../Dialogs/DeleteConfirmationDialog.tsx';
import { EditProjectDialogContainer } from '../../Dialogs/EditProjectDialogContainer.tsx';
import { KubectlDeleteProjectDialog } from '../../Dialogs/KubectlCommandInfo/KubectlDeleteProjectDialog.tsx';
import { useTelemetry } from '../../../lib/telemetry/telemetry.ts';

type ControlPlaneListToolbarProps = {
  projectName: string;
  useDeleteProject?: typeof _useDeleteProject;
  useNavigate?: typeof _useNavigate;
};

export function ControlPlaneListToolbar({
  projectName,
  useDeleteProject = _useDeleteProject,
  useNavigate = _useNavigate,
}: ControlPlaneListToolbarProps) {
  const [dialogCreateProjectIsOpen, setDialogIsOpen] = useState(false);
  const [dialogDeleteProjectIsOpen, setDialogDeleteProjectIsOpen] = useState(false);
  const [dialogEditProjectIsOpen, setDialogEditProjectIsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonId = useId();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const telemetry = useTelemetry();

  const { deleteProject } = useDeleteProject(projectName);

  const handleDeleteProject = async () => {
    try {
      await deleteProject();
      telemetry.track({ name: 'project.deleted', source: 'detail' });
      navigate(Routes.Projects, { replace: true });
    } catch {
      // toast already shown by the hook
    }
  };

  return (
    <>
      <Toolbar className={styles.toolbar}>
        <ToolbarButton
          design="Emphasized"
          icon="add"
          text={t('ControlPlaneListToolbar.buttonText')}
          onClick={() => setDialogIsOpen(true)}
        />
        <Button
          id={menuButtonId}
          data-testid="project-overflow-menu"
          design="Transparent"
          icon="overflow"
          onClick={() => setMenuOpen((prev) => !prev)}
        />
      </Toolbar>

      <Menu
        open={menuOpen}
        opener={menuButtonId}
        onClose={() => setMenuOpen(false)}
        onItemClick={(event) => {
          const action = (event.detail.item as HTMLElement).dataset.action;
          if (action === 'editProject') {
            setDialogEditProjectIsOpen(true);
          }
          if (action === 'deleteProject') {
            setDialogDeleteProjectIsOpen(true);
          }
          setMenuOpen(false);
        }}
      >
        <MenuItem key="edit" text={t('ProjectsListView.editProject')} data-action="editProject" icon="edit" />
        <MenuItem key="delete" text={t('ProjectsListView.deleteProject')} data-action="deleteProject" icon="delete" />
      </Menu>

      <EditProjectDialogContainer
        isOpen={dialogEditProjectIsOpen}
        setIsOpen={setDialogEditProjectIsOpen}
        projectName={projectName}
        source="detail"
      />

      <CreateWorkspaceDialogContainer
        isOpen={dialogCreateProjectIsOpen}
        setIsOpen={setDialogIsOpen}
        project={projectName}
      />

      {dialogDeleteProjectIsOpen && (
        <DeleteConfirmationDialog
          resourceName={projectName}
          kubectlDialog={({ isOpen, onClose }) => (
            <KubectlDeleteProjectDialog projectName={projectName} isOpen={isOpen} onClose={onClose} />
          )}
          isOpen={dialogDeleteProjectIsOpen}
          setIsOpen={setDialogDeleteProjectIsOpen}
          onDeletionConfirmed={handleDeleteProject}
        />
      )}
    </>
  );
}
