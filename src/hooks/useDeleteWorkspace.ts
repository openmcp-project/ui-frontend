import { useCallback } from 'react';
import { useApiResourceMutation, useRevalidateApiResource } from '../lib/api/useApiResource';
import { DeleteWorkspaceResource, DeleteWorkspaceType } from '../lib/api/types/crate/deleteWorkspace';
import { ListWorkspaces } from '../lib/api/types/crate/listWorkspaces';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';

export function useDeleteWorkspace(projectName: string, projectNamespace: string, workspaceName: string) {
  const { t } = useTranslation();
  const toast = useToast();

  const { trigger } = useApiResourceMutation<DeleteWorkspaceType>(
    DeleteWorkspaceResource(projectNamespace, workspaceName),
  );
  const revalidate = useRevalidateApiResource(ListWorkspaces(projectName));

  const deleteWorkspace = useCallback(async (): Promise<void> => {
    await trigger();
    await revalidate();
    toast.show(t('ControlPlaneListWorkspaceGridTile.deleteConfirmationDialog'));
  }, [trigger, revalidate, toast, t]);

  return {
    deleteWorkspace,
  };
}
