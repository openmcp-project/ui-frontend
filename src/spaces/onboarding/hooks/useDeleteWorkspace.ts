import { useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { useToast } from '../../../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { graphql } from '../../../types/__generated__/graphql/index';

const DeleteWorkspaceMutation = graphql(`
  mutation DeleteWorkspace($name: String!, $namespace: String, $dryRun: Boolean) {
    core_openmcp_cloud {
      v1alpha1 {
        deleteWorkspace(name: $name, namespace: $namespace, dryRun: $dryRun)
      }
    }
  }
`);

export function useDeleteWorkspace(projectNamespace: string, workspaceName: string) {
  const { t } = useTranslation();
  const toast = useToast();
  const [deleteWorkspaceMutation] = useMutation(DeleteWorkspaceMutation);

  const deleteWorkspace = useCallback(async (): Promise<void> => {
    try {
      await deleteWorkspaceMutation({
        variables: {
          name: workspaceName,
          namespace: projectNamespace,
        },
      });
      toast.show(t('ControlPlaneListWorkspaceGridTile.deleteConfirmationDialog'));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.show(message);
      throw new Error(message);
    }
  }, [deleteWorkspaceMutation, projectNamespace, toast, t, workspaceName]);

  return {
    deleteWorkspace,
  };
}
