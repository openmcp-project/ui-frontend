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
import { ConnectGitHubDialog } from '../../Dialogs/ConnectGitHubDialog.tsx';
import { CreateWorkspaceDialogContainer } from '../../Dialogs/CreateWorkspaceDialogContainer.tsx';
import { DeleteConfirmationDialog } from '../../Dialogs/DeleteConfirmationDialog.tsx';
import { EditProjectDialogContainer } from '../../Dialogs/EditProjectDialogContainer.tsx';
import { KubectlDeleteProjectDialog } from '../../Dialogs/KubectlCommandInfo/KubectlDeleteProjectDialog.tsx';
import { useTelemetry } from '../../../lib/telemetry/telemetry.ts';
import { useFeatureToggle } from '../../../context/FeatureToggleContext.tsx';

type ControlPlaneListToolbarProps = {
  projectName: string;
  controlPlanes?: { name: string; namespace: string }[];
  useDeleteProject?: typeof _useDeleteProject;
  useNavigate?: typeof _useNavigate;
};

export function ControlPlaneListToolbar({
  projectName,
  controlPlanes = [],
  useDeleteProject = _useDeleteProject,
  useNavigate = _useNavigate,
}: ControlPlaneListToolbarProps) {
  const [dialogCreateProjectIsOpen, setDialogIsOpen] = useState(false);
  const [dialogDeleteProjectIsOpen, setDialogDeleteProjectIsOpen] = useState(false);
  const [dialogEditProjectIsOpen, setDialogEditProjectIsOpen] = useState(false);
  const [dialogConnectGitHubIsOpen, setDialogConnectGitHubIsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonId = useId();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const telemetry = useTelemetry();
  const { enableGitHub } = useFeatureToggle();

  const { deleteProject } = useDeleteProject(projectName);

  const handleDeleteProject = async () => {
    try {
      telemetry.track({ name: 'project.deleted', source: 'detail' });
      await deleteProject();
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
        {enableGitHub && (
          <Button
            data-testid="connect-github-button"
            design="Transparent"
            style={{
              alignItems: 'center',
              background: '#ffffff',
              border: '1px solid var(--sapButton_BorderColor)',
              borderRadius: '4px',
              display: 'inline-flex',
              height: '2.25rem',
              justifyContent: 'center',
              padding: '0',
              width: '2.25rem',
            }}
            tooltip={t('ControlPlaneListToolbar.connectGitHub')}
            onClick={() => {
              telemetry.track({ name: 'project.connect-github-opened' });
              setDialogConnectGitHubIsOpen(true);
            }}
          >
            <img
              alt="GitHub"
              src="/github-dark.png"
              style={{ display: 'block', height: '1.125rem', width: '1.125rem' }}
            />
          </Button>
        )}
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

      <ConnectGitHubDialog
        isOpen={dialogConnectGitHubIsOpen}
        projectName={projectName}
        controlPlanes={controlPlanes}
        onClose={() => setDialogConnectGitHubIsOpen(false)}
      />

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
