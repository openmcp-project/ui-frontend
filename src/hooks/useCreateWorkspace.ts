import { useCallback } from 'react';
import { useApiResourceMutation, useRevalidateApiResource } from '../lib/api/useApiResource';
import { CreateWorkspace, CreateWorkspaceResource, CreateWorkspaceType } from '../lib/api/types/crate/createWorkspace';
import { ListWorkspaces } from '../lib/api/types/crate/listWorkspaces';
import { useToast } from '../context/ToastContext';
import { Member } from '../lib/api/types/shared/members';
import { useTranslation } from 'react-i18next';

export interface CreateWorkspaceParams {
  name: string;
  displayName?: string;
  chargingTarget?: string;
  chargingTargetType?: string;
  members: Member[];
}

export function useCreateWorkspace(projectName: string, namespace: string) {
  const { t } = useTranslation();
  const toast = useToast();

  const { trigger } = useApiResourceMutation<CreateWorkspaceType>(CreateWorkspaceResource(namespace));
  const revalidate = useRevalidateApiResource(ListWorkspaces(projectName));

  const createWorkspace = useCallback(
    async ({
      name,
      displayName,
      chargingTarget,
      chargingTargetType,
      members,
    }: CreateWorkspaceParams): Promise<void> => {
      await trigger(
        CreateWorkspace(name, namespace, {
          displayName,
          chargingTarget,
          chargingTargetType,
          members,
        }),
      );
      await revalidate();
      toast.show(t('CreateWorkspaceDialog.toastMessage'));
    },
    [trigger, revalidate, toast, t, namespace],
  );

  return {
    createWorkspace,
  };
}
