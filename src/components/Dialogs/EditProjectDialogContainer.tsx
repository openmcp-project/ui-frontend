import { useEffect, useMemo, useRef } from 'react';
import { BusyIndicator, Dialog } from '@ui5/webcomponents-react';
import { ErrorDialog, ErrorDialogHandle } from '../Shared/ErrorMessageBox.tsx';
import { CreateProjectWorkspaceDialog, OnCreatePayload } from './CreateProjectWorkspaceDialog.tsx';
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

/**
 * Inner form component: mounts `useForm` with real defaults on first render.
 *
 * Splitting this out fixes a Cypress-visible flake: previously the outer
 * container mounted `useForm` with empty strings and then re-populated via
 * `useEffect(() => reset(projectData))`. In the tick between mount and the
 * effect, react-hook-form briefly disables inputs during the reset
 * transaction, which UI5 propagates onto the shadow inner `<input>`. Any
 * `cy.type()` firing in that window failed with
 * "cy.type() failed because it targeted a disabled element".
 *
 * By taking `projectData` as a required prop and passing it straight into
 * `defaultValues`, the form is populated on the very first render — no
 * empty-then-reset flash, no disabled window.
 */
function EditProjectForm({
  projectData,
  isOpen,
  setIsOpen,
  errorDialogRef,
  onUpdate,
}: {
  projectData: ProjectData;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  errorDialogRef: React.RefObject<ErrorDialogHandle | null>;
  onUpdate: (payload: OnCreatePayload) => Promise<boolean>;
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
    // Synchronous defaults — see file docstring on why this matters.
    defaultValues: {
      name: projectData.name,
      displayName: projectData.displayName,
      chargingTarget: projectData.chargingTarget,
      chargingTargetType: projectData.chargingTargetType?.toLowerCase() || 'btp',
      members: projectData.members,
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
      onCreate={handleSubmit(onUpdate)}
    />
  );
}

export function EditProjectDialogContainer({
  isOpen,
  setIsOpen,
  projectName,
  source,
  useUpdateProject = _useUpdateProject,
  useGetProject = _useGetProject,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  projectName: string;
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
  }: OnCreatePayload): Promise<boolean> => {
    try {
      await updateProject({
        name,
        displayName,
        chargingTarget,
        chargingTargetType,
        members,
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
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          errorDialogRef={errorDialogRef}
          onUpdate={handleProjectUpdate}
        />
      )}
    </>
  );
}
