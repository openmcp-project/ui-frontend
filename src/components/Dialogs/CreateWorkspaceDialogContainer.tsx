import { useEffect, useRef } from 'react';
import {
  useApiResourceMutation,
  useRevalidateApiResource,
} from '../../lib/api/useApiResource';
import { ErrorDialogHandle } from '../Shared/ErrorMessageBox.tsx';
import { APIError } from '../../lib/api/error';
import {
  CreateProjectWorkspaceDialog,
  OnCreatePayload,
} from './CreateProjectWorkspaceDialog.tsx';
import {
  CreateWorkspace,
  CreateWorkspaceResource,
  CreateWorkspaceType,
} from '../../lib/api/types/crate/createWorkspace';
import { projectnameToNamespace } from '../../utils';
import { ListWorkspaces } from '../../lib/api/types/crate/listWorkspaces';
import { useToast } from '../../context/ToastContext.tsx';
import { useAuthSubject } from '../../lib/oidc/useUsername.ts';
import { Member, MemberRoles } from '../../lib/api/types/shared/members.ts';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { validationSchemaProjectWorkspace } from '../../lib/api/validations/schemas.ts';

export type CreateDialogProps = {
  name: string;
  displayName?: string;
  chargingTarget?: string;
  members: [Member, ...Member[]];
};

export function CreateWorkspaceDialogContainer({
  isOpen,
  setIsOpen,
  project = '',
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  project?: string;
}) {
  const {
    register,
    handleSubmit,
    reset,
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

  useEffect(() => {
    if (username) {
      setValue('members', [
        { name: username, roles: [MemberRoles.admin], kind: 'User' },
      ]);
    }
    return () => {
      reset();
    };
  }, []);
  const namespace = projectnameToNamespace(project);
  const toast = useToast();

  const { trigger } = useApiResourceMutation<CreateWorkspaceType>(
    CreateWorkspaceResource(namespace),
  );
  const revalidate = useRevalidateApiResource(ListWorkspaces(project));
  const errorDialogRef = useRef<ErrorDialogHandle>(null);

  const handleWorkspaceCreate = async ({
    name,
    displayName,
    chargingTarget,
    members,
  }: OnCreatePayload): Promise<boolean> => {
    try {
      await trigger(
        CreateWorkspace(name, namespace, {
          displayName: displayName,
          chargingTarget: chargingTarget,
          members: members,
        }),
      );
      await revalidate();
      setIsOpen(false);
      toast.show(t('CreateWorkspaceDialog.toastMessage'));
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
      titleText="Create Workspace"
      members={watch('members')}
      register={register}
      errors={errors}
      setValue={setValue}
      onCreate={handleSubmit(handleWorkspaceCreate)}
    />
  );
}
