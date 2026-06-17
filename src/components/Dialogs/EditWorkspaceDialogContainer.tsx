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
import { useGetWorkspace as _useGetWorkspace } from '../../spaces/onboarding/hooks/useGetWorkspace.ts';

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
      chargingTargetType: '',
      members: [],
    },
  });
  const members = useWatch({ control, name: 'members' });
  const { updateWorkspace } = useUpdateWorkspace();
  const {
    workspaceData,
    isLoading,
    error: fetchError,
  } = useGetWorkspace(isOpen ? workspaceName : undefined, isOpen ? namespace : undefined);
  const errorDialogRef = useRef<ErrorDialogHandle>(null);
  const hasPopulated = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasPopulated.current = false;
      return;
    }
    if (!workspaceData || hasPopulated.current) return;
    hasPopulated.current = true;
    reset({
      name: workspaceData.name,
      displayName: workspaceData.displayName,
      chargingTarget: workspaceData.chargingTarget,
      chargingTargetType: workspaceData.chargingTargetType?.toLowerCase() || '',
      members: workspaceData.members,
    });
  }, [isOpen, workspaceData, reset]);

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
      <Dialog open={isOpen && isLoading && !fetchError} headerText={t('EditWorkspaceDialog.title')}>
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
          titleText={t('EditWorkspaceDialog.title')}
          members={members}
          register={register}
          errors={errors}
          setValue={setValue}
          type={'workspace'}
          isEditMode
          // eslint-disable-next-line react-hooks/refs
          onCreate={handleSubmit(handleWorkspaceUpdate)}
        />
      )}
    </>
  );
}
