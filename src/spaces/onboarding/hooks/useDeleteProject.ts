import { useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { useToast } from '../../../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { graphql } from '../../../types/__generated__/graphql/index';

const DeleteProjectMutation = graphql(`
  mutation DeleteProject($name: String!, $dryRun: Boolean) {
    core_openmcp_cloud {
      v1alpha1 {
        deleteProject(name: $name, dryRun: $dryRun)
      }
    }
  }
`);

export function useDeleteProject(projectName: string) {
  const { t } = useTranslation();
  const toast = useToast();
  const [deleteProjectMutation] = useMutation(DeleteProjectMutation);

  const deleteProject = useCallback(async (): Promise<void> => {
    try {
      await deleteProjectMutation({
        variables: {
          name: projectName,
        },
      });
      toast.show(t('ProjectsListView.deleteConfirmationDialog'));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.show(message);
    }
  }, [deleteProjectMutation, projectName, toast, t]);

  return {
    deleteProject,
  };
}
