import { useCallback } from 'react';
import { useApiResourceMutation } from '../lib/api/useApiResource';
import { DeleteProjectResource } from '../lib/api/types/crate/deleteProject';
import { DeleteWorkspaceType } from '../lib/api/types/crate/deleteWorkspace';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';

export function useDeleteProject(projectName: string) {
  const { t } = useTranslation();
  const toast = useToast();

  const { trigger } = useApiResourceMutation<DeleteWorkspaceType>(DeleteProjectResource(projectName));

  const deleteProject = useCallback(async (): Promise<void> => {
    await trigger();
    toast.show(t('ProjectsListView.deleteConfirmationDialog'));
  }, [trigger, toast, t]);

  return {
    deleteProject
  };
}
