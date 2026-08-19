import { useEffect, useMemo, useRef } from 'react';
import { BusyIndicator, Dialog } from '@ui5/webcomponents-react';
import { ErrorDialog, ErrorDialogHandle } from '../Shared/ErrorMessageBox.tsx';
import { CreateProjectWorkspaceDialog, OnCreatePayload, Step } from './CreateProjectWorkspaceDialog.tsx';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { createProjectWorkspaceSchema } from '../../lib/api/validations/schemas.ts';
import { CreateDialogProps } from './CreateWorkspaceDialogContainer.tsx';
import { useUpdateProject as _useUpdateProject } from '../../spaces/onboarding/hooks/useUpdateProject.ts';
import { useGetProject as _useGetProject, ProjectData } from '../../spaces/onboarding/hooks/useGetProject.ts';
import { useTelemetry } from '../../lib/telemetry/telemetry.ts';
import type { TelemetryFeature } from '../../lib/telemetry/features.ts';

type ProjectEditedSource = Extract<TelemetryFeature, { name: 'project.edited' }>['source'];

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
  const validationSchemaProjectWorkspace = useMemo(() => createProjectWorkspaceSchema(t), [t]);
  const {
    watch,
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateDialogProps>({
    resolver: zodResolver(validationSchemaProjectWorkspace),
    defaultValues: {
      name: projectData.name,
      displayName: projectData.displayName,
      chargingTarget: projectData.chargingTarget,
      chargingTargetType: projectData.chargingTargetType?.toLowerCase() || 'btp',
      members: projectData.members,
      supportServiceIds: projectData.supportServiceIds,
      supportLandscape: projectData.supportLandscape,
      supportSecurityContacts: projectData.supportSecurityContacts,
      supportOpsContacts: projectData.supportOpsContacts,
    },
  });
  const members = useWatch({ control, name: 'members' });

  return (
    <CreateProjectWorkspaceDialog
      watch={watch}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      errorDialogRef={errorDialogRef}
      titleText={t('EditProjectDialog.title')}
      members={members}
      register={register}
      errors={errors}
      setValue={setValue}
      type={'project'}
      isEditMode
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
      errorDialogRef.current?.showErrorDialog(fetchError instanceof Error ? fetchError.message : String(fetchError));
    }
  }, [fetchError]);

  const handleProjectUpdate = async ({
    name,
    chargingTarget,
    displayName,
    chargingTargetType,
    members,
    supportServiceIds,
    supportLandscape,
    supportSecurityContacts,
    supportOpsContacts,
  }: OnCreatePayload): Promise<boolean> => {
    try {
      await updateProject({
        name,
        displayName,
        chargingTarget,
        chargingTargetType,
        members,
        supportServiceIds,
        supportLandscape,
        supportSecurityContacts,
        supportOpsContacts,
      });
      telemetry.track({ name: 'project.edited', source });
      setIsOpen(false);
      return true;
    } catch (e) {
      console.error(e);
      errorDialogRef.current?.showErrorDialog(e instanceof Error ? e.message : String(e));
      return false;
    }
  };

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
