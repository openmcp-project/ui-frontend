import { useCallback, useEffect, useRef } from 'react';
import { useApiResourceMutation } from '../../lib/api/useApiResource';
import { ErrorDialogHandle } from '../Shared/ErrorMessageBox.tsx';
import { APIError } from '../../lib/api/error';
import {
  CreateProjectWorkspaceDialog,
  OnCreatePayload,
} from './CreateProjectWorkspaceDialog.tsx';

import { useToast } from '../../context/ToastContext.tsx';
import { useAuthSubject } from '../../lib/oidc/useUsername.ts';
import { MemberRoles } from '../../lib/api/types/shared/members.ts';

import { useTranslation } from 'react-i18next';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  CreateProject,
  CreateProjectResource,
  CreateProjectType,
} from '../../lib/api/types/crate/createProject.ts';
import { validationSchemaProjectWorkspace } from '../../lib/api/validations/schemas.ts';
import { CreateDialogProps } from './CreateWorkspaceDialogContainer.tsx';

export function CreateProjectDialogContainer({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
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
    },
  });

  const username = useAuthSubject();

  const { t } = useTranslation();

  const clearForm = useCallback(() => {
    resetField('name');
    resetField('chargingTarget');
    resetField('displayName');
  }, [resetField]);

  useEffect(() => {
    if (username) {
      setValue('members', [
        { name: username, roles: [MemberRoles.admin], kind: 'User' },
      ]);
    }
    if (!isOpen) {
      clearForm();
    }
  }, [resetField, setValue, username, isOpen, clearForm]);

  const toast = useToast();

  const { trigger } = useApiResourceMutation<CreateProjectType>(
    CreateProjectResource(),
  );

  const errorDialogRef = useRef<ErrorDialogHandle>(null);

  const handleProjectCreate = async ({
    name,
    chargingTarget,
    displayName,
    members,
  }: OnCreatePayload): Promise<boolean> => {
    try {
      await trigger(
        CreateProject(name, {
          displayName: displayName,
          chargingTarget: chargingTarget,
          members: members,
        }),
      );
      setIsOpen(false);
      toast.show(t('CreateProjectDialog.toastMessage'));
      return true;
    } catch (e) {
      console.error(e);
      if (e instanceof APIError) {
        if (errorDialogRef.current) {
          errorDialogRef.current.showErrorDialog(
            `${e.message}: ${JSON.stringify(e.info)}`,
          );
        }
      }
      return false;
    }
  };

  return (
    <CreateProjectWorkspaceDialog
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      errorDialogRef={errorDialogRef}
      titleText="Create Project"
      members={watch('members')}
      register={register}
      errors={errors}
      setValue={setValue}
      onCreate={handleSubmit(handleProjectCreate)}
    />
  );
}
