import '@ui5/webcomponents-icons/dist/hint';
import { Button, Title } from '@ui5/webcomponents-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate as _useNavigate } from 'react-router-dom';
import { Routes } from '../../../Routes.ts';
import { useDeleteProject as _useDeleteProject } from '../../../spaces/onboarding/hooks/useDeleteProject.ts';
import { useProjectMembers as _useProjectMembers } from '../../../spaces/onboarding/hooks/useProjectMembers.ts';
import { DeleteConfirmationDialog } from '../../Dialogs/DeleteConfirmationDialog.tsx';
import { EditProjectDialogContainer } from '../../Dialogs/EditProjectDialogContainer.tsx';
import { KubectlDeleteProjectDialog } from '../../Dialogs/KubectlCommandInfo/KubectlDeleteProjectDialog.tsx';
import { useTelemetry } from '../../../lib/telemetry/telemetry.ts';
import { ProjectInfoPopover } from './ProjectInfoPopover.tsx';
import styles from './ProjectInfoPopoverButton.module.css';

type ProjectInfoPopoverButtonProps = {
  projectName: string;
  useDeleteProject?: typeof _useDeleteProject;
  useNavigate?: typeof _useNavigate;
  useProjectMembers?: typeof _useProjectMembers;
};

export function ProjectInfoPopoverButton({
  projectName,
  useDeleteProject = _useDeleteProject,
  useNavigate = _useNavigate,
  useProjectMembers = _useProjectMembers,
}: ProjectInfoPopoverButtonProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dialogDeleteOpen, setDialogDeleteOpen] = useState(false);
  const [dialogEditOpen, setDialogEditOpen] = useState(false);
  const buttonId = useId();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const telemetry = useTelemetry();

  const { deleteProject } = useDeleteProject(projectName);
  const { displayName } = useProjectMembers(projectName);

  const handleDeleteProject = async () => {
    try {
      telemetry.track({ category: 'project', action: 'deleted', source: 'detail' });
      await deleteProject();
      navigate(Routes.Projects, { replace: true });
    } catch {
      // toast already shown by the hook
    }
  };

  return (
    <>
      <button
        type="button"
        data-testid="project-info-button"
        className={styles.titleButton}
        title={t('ProjectInfoPopover.infoButton')}
        onClick={() => setPopoverOpen((prev) => !prev)}
      >
        <Title level="H2" className={styles.title}>
          {displayName || projectName}
        </Title>
      </button>
      <Button
        id={buttonId}
        design="Transparent"
        icon="hint"
        className={styles.infoButton}
        tooltip={t('ProjectInfoPopover.infoButton')}
        onClick={() => setPopoverOpen((prev) => !prev)}
      />

      <ProjectInfoPopover
        opener={buttonId}
        open={popoverOpen}
        projectName={projectName}
        useProjectMembers={useProjectMembers}
        onClose={() => setPopoverOpen(false)}
        onDeleteClick={() => setDialogDeleteOpen(true)}
        onEditClick={() => setDialogEditOpen(true)}
      />

      <EditProjectDialogContainer
        isOpen={dialogEditOpen}
        setIsOpen={setDialogEditOpen}
        projectName={projectName}
        source="detail"
      />

      {dialogDeleteOpen && (
        <DeleteConfirmationDialog
          resourceName={projectName}
          kubectlDialog={({ isOpen, onClose }) => (
            <KubectlDeleteProjectDialog projectName={projectName} isOpen={isOpen} onClose={onClose} />
          )}
          isOpen={dialogDeleteOpen}
          setIsOpen={setDialogDeleteOpen}
          onDeletionConfirmed={handleDeleteProject}
        />
      )}
    </>
  );
}
