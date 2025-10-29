import { useCallback, useRef } from 'react';
import { useApiResourceMutation, useRevalidateApiResource } from '../lib/api/useApiResource';
import { CreateWorkspace, CreateWorkspaceResource, CreateWorkspaceType } from '../lib/api/types/crate/createWorkspace';
import { ListWorkspaces } from '../lib/api/types/crate/listWorkspaces';
import { useToast } from '../context/ToastContext';
import { APIError } from '../lib/api/error';
import { ErrorDialogHandle } from '../components/Shared/ErrorMessageBox';
import { Member } from '../lib/api/types/shared/members';
import { useTranslation } from 'react-i18next';

export interface CreateWorkspaceParams {
  name: string;
  namespace: string;
  displayName?: string;
  chargingTarget?: string;
  members: Member[];
}

export function useCreateWorkspace(projectName: string, namespace: string) {
  const { t } = useTranslation();
  const toast = useToast();
  const errorDialogRef = useRef<ErrorDialogHandle>(null);

  const { trigger, isMutating } = useApiResourceMutation<CreateWorkspaceType>(CreateWorkspaceResource(namespace));
  const revalidate = useRevalidateApiResource(ListWorkspaces(projectName));

  const createWorkspace = useCallback(
    async ({
      name,
      displayName,
      chargingTarget,
      members,
    }: Omit<CreateWorkspaceParams, 'namespace'>): Promise<boolean> => {
      try {
        await trigger(
          CreateWorkspace(name, namespace, {
            displayName,
            chargingTarget,
            members,
          }),
        );
        await revalidate();
        toast.show(t('CreateWorkspaceDialog.toastMessage'));
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
    },
    [trigger, revalidate, toast, t, namespace],
  );

  return {
    createWorkspace,
    isLoading: isMutating,
    errorDialogRef,
  };
}
