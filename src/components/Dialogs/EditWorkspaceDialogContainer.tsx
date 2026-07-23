import { useEffect, useMemo, useRef } from 'react';
import { BusyIndicator, Dialog } from '@ui5/webcomponents-react';
import { ErrorDialog, ErrorDialogHandle } from '../Shared/ErrorMessageBox.tsx';
import { CreateProjectWorkspaceDialog, OnCreatePayload } from './CreateProjectWorkspaceDialog.tsx';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { createProjectWorkspaceSchema } from '../../lib/api/validations/schemas.ts';
import { CreateDialogProps } from './CreateWorkspaceDialogContainer.tsx';
import { useUpdateWorkspace as _useUpdateWorkspace } from '../../spaces/onboarding/hooks/useUpdateWorkspace.ts';
import { useGetWorkspace as _useGetWorkspace, WorkspaceData } from '../../spaces/onboarding/hooks/useGetWorkspace.ts';
import { useTelemetry } from '../../lib/telemetry/telemetry.ts';

function EditWorkspaceForm({
  workspaceData,
  isOpen,
  setIsOpen,
  errorDialogRef,
  onUpdate,
}: {
  workspaceData: WorkspaceData;
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
    defaultValues: {
      name: workspaceData.name,
      displayName: workspaceData.displayName,
      chargingTarget: workspaceData.chargingTarget,
      chargingTargetType: workspaceData.chargingTargetType?.toLowerCase() || '',
      members: workspaceData.members,
    },
  });
  const members = useWatch({ control, name: 'members' });

  return (
    <CreateProjectWorkspaceDialog
      watch={watch}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      errorDialogRef={errorDialogRef}
      titleText={t('EditWorkspaceDialog.title')}
      members={members}
      register={register}
      errors={errors}
      setValue={setValue}
      type={'workspace'}
      isEditMode
      onCreate={handleSubmit(onUpdate)}
    />
  );
}

export function EditWorkspaceDialogContainer({
  isOpen,
  setIsOpen,
  workspaceName,
  namespace,
  useUpdateWorkspace = _useUpdateWorkspace,
  useGetWorkspace = _useGetWorkspace,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  workspaceName: string;
  namespace: string;
  useUpdateWorkspace?: typeof _useUpdateWorkspace;
  useGetWorkspace?: typeof _useGetWorkspace;
}) {
  const { t } = useTranslation();
  const { updateWorkspace } = useUpdateWorkspace();
  const telemetry = useTelemetry();
  const {
    workspaceData,
    isLoading,
    error: fetchError,
  } = useGetWorkspace(isOpen ? workspaceName : undefined, isOpen ? namespace : undefined);
  const errorDialogRef = useRef<ErrorDialogHandle>(null);

  useEffect(() => {
    if (fetchError) {
      errorDialogRef.current?.showErrorDialog(fetchError instanceof Error ? fetchError.message : String(fetchError));
    }
  }, [fetchError]);

  const handleWorkspaceUpdate = async ({
    name,
    chargingTarget,
    displayName,
    chargingTargetType,
    members,
  }: OnCreatePayload): Promise<boolean> => {
    try {
      await updateWorkspace(namespace, {
        name,
        displayName,
        chargingTarget,
        chargingTargetType,
        members,
      });
      telemetry.track({ name: 'workspace.edited' });
      setIsOpen(false);
      return true;
    } catch (e) {
      console.error(e);
      errorDialogRef.current?.showErrorDialog(e instanceof Error ? e.message : String(e));
      return false;
    }
  };

  const showBusy = isOpen && isLoading && !fetchError;
  const showForm = isOpen && !isLoading && !fetchError && !!workspaceData;

  return (
    <>
      <Dialog open={showBusy} headerText={t('EditWorkspaceDialog.title')}>
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
        <EditWorkspaceForm
          workspaceData={workspaceData!}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          errorDialogRef={errorDialogRef}
          onUpdate={handleWorkspaceUpdate}
        />
      )}
    </>
  );
}
