import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ErrorDialogHandle } from '../Shared/ErrorMessageBox.tsx';
import { APIError } from '../../lib/api/error';
import { CreateProjectWorkspaceDialog, OnCreatePayload } from './CreateProjectWorkspaceDialog.tsx';
import { useAuthOnboarding as _useAuthOnboarding } from '../../spaces/onboarding/auth/AuthContextOnboarding.tsx';
import { MemberRoles } from '../../lib/api/types/shared/members.ts';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { createProjectWorkspaceSchema } from '../../lib/api/validations/schemas.ts';
import { CreateDialogProps } from './CreateWorkspaceDialogContainer.tsx';
import { useCreateProject as _useCreateProject } from '../../hooks/useCreateProject.ts';

export function CreateProjectDialogContainer({
  isOpen,
  setIsOpen,
  useCreateProject = _useCreateProject,
  useAuthOnboarding = _useAuthOnboarding,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  useCreateProject?: typeof _useCreateProject;
  useAuthOnboarding?: typeof _useAuthOnboarding;
}) {
  const { t } = useTranslation();
  const validationSchemaProjectWorkspace = useMemo(() => createProjectWorkspaceSchema(t), [t]);
  const {
    watch,
    register,
    handleSubmit,
    resetField,
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
  const { user } = useAuthOnboarding();

  const username = user?.email;
  const { createProject } = useCreateProject();
  const errorDialogRef = useRef<ErrorDialogHandle>(null);

  const clearForm = useCallback(() => {
    resetField('name');
    resetField('chargingTarget');
    resetField('displayName');
    resetField('chargingTargetType');
  }, [resetField]);

  useEffect(() => {
    if (username) {
      setValue('members', [{ name: username, roles: [MemberRoles.admin], kind: 'User' }]);
    }
    if (!isOpen) {
      clearForm();
    }
  }, [resetField, setValue, username, isOpen, clearForm]);

  const handleProjectCreate = async ({
    name,
    chargingTarget,
    displayName,
    chargingTargetType,
    members,
  }: OnCreatePayload): Promise<boolean> => {
    try {
      await createProject({
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
      if (e instanceof APIError) {
        if (errorDialogRef.current) {
          errorDialogRef.current.showErrorDialog(`${e.message}: ${JSON.stringify(e.info)}`);
        }
      }
      return false;
    }
  };

  return (
    <CreateProjectWorkspaceDialog
      watch={watch}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      errorDialogRef={errorDialogRef}
      titleText="Create Project"
      members={watch('members')}
      register={register}
      errors={errors}
      setValue={setValue}
      type={'project'}
      onCreate={handleSubmit(handleProjectCreate)}
    />
  );
}
