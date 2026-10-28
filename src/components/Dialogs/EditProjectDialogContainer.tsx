import { useCallback, useEffect, useRef } from 'react';
import { BusyIndicator, Dialog } from '@ui5/webcomponents-react';
import { ErrorDialog, ErrorDialogHandle } from '../Shared/ErrorMessageBox.tsx';
import { extractErrorMessage } from '../../lib/api/error.ts';
import { CreateProjectWorkspaceDialog, OnCreatePayload, Step } from './CreateProjectWorkspaceDialog.tsx';
import { useTranslation } from 'react-i18next';
import { useWatch } from 'react-hook-form';
import { useUpdateProject as _useUpdateProject } from '../../spaces/onboarding/hooks/useUpdateProject.ts';
import { useGetProject as _useGetProject, ProjectData } from '../../spaces/onboarding/hooks/useGetProject.ts';
import { useTelemetry } from '../../lib/telemetry/telemetry.ts';
import type { TelemetryFeature } from '../../lib/telemetry/features.ts';
import { useProjectForm } from './useProjectForm.ts';

type ProjectEditedSource = Extract<TelemetryFeature, { category: 'project'; action: 'edited' }>['source'];

function EditProjectForm({
  projectData,
  isOpen,
  setIsOpen,
  errorDialogRef,
  onUpdate,
  initialStep,
}: {
  projectData: ProjectData;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  errorDialogRef: React.RefObject<ErrorDialogHandle | null>;
  onUpdate: (payload: OnCreatePayload) => Promise<boolean>;
  initialStep?: Step;
}) {
  const { t } = useTranslation();
  const {
    watch,
    control,
    register,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors },
  } = useProjectForm({
    name: projectData.name,
    displayName: projectData.displayName,
    chargingTarget: projectData.chargingTarget,
    chargingTargetType: projectData.chargingTargetType?.toLowerCase() || 'btp',
    members: projectData.members,
    supportServiceIds: projectData.supportServiceIds,
    supportLandscape: projectData.supportLandscape,
    supportSecurityContacts: projectData.supportSecurityContacts,
    supportOpsContacts: projectData.supportOpsContacts,
  });
  const members = useWatch({ control, name: 'members' });

  useEffect(() => {
    void trigger();
  }, [trigger]);

  return (
    <CreateProjectWorkspaceDialog
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      errorDialogRef={errorDialogRef}
      titleText={t('EditProjectDialog.title')}
      members={members}
      form={{ register, errors, setValue, watch, handleSubmit }}
      type={'project'}
      isEditMode
      isMetadataValid={!errors.name && !errors.chargingTarget}
      initialStep={initialStep}
      onCreate={handleSubmit(onUpdate)}
    />
  );
}

export function EditProjectDialogContainer({
  isOpen,
  setIsOpen,
  projectName,
  initialStep,
  source,
  useUpdateProject = _useUpdateProject,
  useGetProject = _useGetProject,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  projectName: string;
  initialStep?: Step;
  source: ProjectEditedSource;
  useUpdateProject?: typeof _useUpdateProject;
  useGetProject?: typeof _useGetProject;
}) {
  const { t } = useTranslation();
  const { updateProject } = useUpdateProject();
  const telemetry = useTelemetry();
  const { projectData, isLoading, error: fetchError } = useGetProject(isOpen ? projectName : undefined);
  const errorDialogRef = useRef<ErrorDialogHandle>(null);

  useEffect(() => {
    if (fetchError) {
      errorDialogRef.current?.showErrorDialog(extractErrorMessage(fetchError));
    }
  }, [fetchError]);

  const handleProjectUpdate = useCallback(
    async (payload: OnCreatePayload): Promise<boolean> => {
      try {
        await updateProject(payload);
        telemetry.track({ category: 'project', action: 'edited', source });
        setIsOpen(false);
        return true;
      } catch (e) {
        errorDialogRef.current?.showErrorDialog(extractErrorMessage(e));
        return false;
      }
    },
    [updateProject, telemetry, setIsOpen, source],
  );

  const showBusy = isOpen && isLoading && !fetchError;
  const showForm = isOpen && !isLoading && !fetchError && !!projectData;

  return (
    <>
      <Dialog open={showBusy} headerText={t('EditProjectDialog.title')}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '10rem',
            padding: '2rem',
          }}
        >
          <BusyIndicator active delay={0} />
        </div>
      </Dialog>
      <ErrorDialog ref={errorDialogRef} />
      {showForm && (
        <EditProjectForm
          projectData={projectData!}
          initialStep={initialStep}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          errorDialogRef={errorDialogRef}
          onUpdate={handleProjectUpdate}
        />
      )}
    </>
  );
}
