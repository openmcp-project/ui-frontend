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
import { useGetProject as _useGetProject } from '../../spaces/onboarding/hooks/useGetProject.ts';

export function EditProjectDialogContainer({
  isOpen,
  setIsOpen,
  projectName,
  initialStep,
  useUpdateProject = _useUpdateProject,
  useGetProject = _useGetProject,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  projectName: string;
  initialStep?: Step;
  useUpdateProject?: typeof _useUpdateProject;
  useGetProject?: typeof _useGetProject;
}) {
  const { t } = useTranslation();
  const validationSchemaProjectWorkspace = useMemo(() => createProjectWorkspaceSchema(t), [t]);
  const {
    watch,
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateDialogProps>({
    resolver: zodResolver(validationSchemaProjectWorkspace),
    defaultValues: {
      name: '',
      displayName: '',
      chargingTarget: '',
      chargingTargetType: 'btp',
      members: [],
    },
  });
  const members = useWatch({ control, name: 'members' });
  const { updateProject } = useUpdateProject();
  const { projectData, isLoading, error: fetchError } = useGetProject(isOpen ? projectName : undefined);
  const errorDialogRef = useRef<ErrorDialogHandle>(null);
  const hasPopulated = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasPopulated.current = false;
      return;
    }
    if (!projectData || hasPopulated.current) return;
    hasPopulated.current = true;
    reset({
      name: projectData.name,
      displayName: projectData.displayName,
      chargingTarget: projectData.chargingTarget,
      chargingTargetType: projectData.chargingTargetType?.toLowerCase() || 'btp',
      members: projectData.members,
      supportServiceIds: projectData.supportServiceIds,
      supportManagedRegions: projectData.supportManagedRegions,
      supportLandscape: projectData.supportLandscape,
      supportSecurityContacts: projectData.supportSecurityContacts,
      supportOpsContacts: projectData.supportOpsContacts,
    });
  }, [isOpen, projectData, reset]);

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
    supportManagedRegions,
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
        supportManagedRegions,
        supportLandscape,
        supportSecurityContacts,
        supportOpsContacts,
      });
      setIsOpen(false);
      return true;
    } catch (e) {
      console.error(e);
      errorDialogRef.current?.showErrorDialog(e instanceof Error ? e.message : String(e));
      return false;
    }
  };

  return (
    <>
      <Dialog stretch open={isOpen && isLoading && !fetchError} headerText={t('EditProjectDialog.title')}>
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
      {isOpen && !isLoading && !fetchError && (
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
          // eslint-disable-next-line react-hooks/refs
          onCreate={handleSubmit(handleProjectUpdate)}
        />
      )}
    </>
  );
}
