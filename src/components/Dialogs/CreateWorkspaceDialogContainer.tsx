import { useCallback, useEffect, useMemo } from 'react';
import { CreateProjectWorkspaceDialog, OnCreatePayload } from './CreateProjectWorkspaceDialog.tsx';
import { projectnameToNamespace } from '../../utils';
import { useAuthOnboarding } from '../../spaces/onboarding/auth/AuthContextOnboarding.tsx';
import { Member, MemberRoles } from '../../lib/api/types/shared/members.ts';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { createProjectWorkspaceSchema } from '../../lib/api/validations/schemas.ts';
import { ComponentsListItem } from '../../lib/api/types/crate/createManagedControlPlane.ts';
import { useCreateWorkspace } from '../../hooks/useCreateWorkspace.tsx';

export type CreateDialogProps = {
  name: string;
  displayName?: string;
  chargingTarget?: string;
  chargingTargetType?: string;
  members: Member[];
  componentsList?: ComponentsListItem[];
};

export function CreateWorkspaceDialogContainer({
  isOpen,
  setIsOpen,
  project = '',
  useCreateWorkspace: useCreateWorkspaceHook = useCreateWorkspace,
  useAuthOnboarding: useAuthOnboardingHook = useAuthOnboarding,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  project?: string;
  useCreateWorkspace?: typeof useCreateWorkspace;
  useAuthOnboarding?: typeof useAuthOnboarding;
}) {
  const { t } = useTranslation();
  const validationSchemaProjectWorkspace = useMemo(() => createProjectWorkspaceSchema(t), [t]);
  const {
    register,
    handleSubmit,
    resetField,
    setValue,
    formState: { errors },
    watch,
  } = useForm<CreateDialogProps>({
    resolver: zodResolver(validationSchemaProjectWorkspace),
    defaultValues: {
      name: '',
      displayName: '',
      chargingTarget: '',
      members: [],
      chargingTargetType: '',
    },
  });
  const { user } = useAuthOnboardingHook();

  const username = user?.email;
  const namespace = projectnameToNamespace(project);

  const { createWorkspace, errorDialogRef } = useCreateWorkspaceHook(project, namespace);

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

  const handleWorkspaceCreate = async ({
    name,
    displayName,
    chargingTarget,
    members,
  }: OnCreatePayload): Promise<boolean> => {
    const success = await createWorkspace({
      name,
      displayName,
      chargingTarget,
      members,
    });

    if (success) {
      setIsOpen(false);
    }

    return success;
  };

  return (
    <CreateProjectWorkspaceDialog
      watch={watch}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      errorDialogRef={errorDialogRef}
      titleText="Create Workspace"
      members={watch('members')}
      register={register}
      errors={errors}
      setValue={setValue}
      type={'workspace'}
      projectName={project}
      onCreate={handleSubmit(handleWorkspaceCreate)}
    />
  );
}
