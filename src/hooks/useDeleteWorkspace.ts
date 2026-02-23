import { useCallback } from 'react';
import { useApiResourceMutation } from '../lib/api/useApiResource';
import { DeleteWorkspaceResource, DeleteWorkspaceType } from '../lib/api/types/crate/deleteWorkspace';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';

export function useDeleteWorkspace(projectNamespace: string, workspaceName: string) {
  const { t } = useTranslation();
  const toast = useToast();
  const { trigger } = useApiResourceMutation<DeleteWorkspaceType>(
    DeleteWorkspaceResource(projectNamespace, workspaceName),
  );

  const deleteWorkspace = useCallback(async (): Promise<void> => {
    await trigger();
    toast.show(t('ControlPlaneListWorkspaceGridTile.deleteConfirmationDialog'));
  }, [trigger, toast, t]);

  return {
    deleteWorkspace,
  };
}
