import { useCallback } from 'react';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
const DeleteWorkspaceMutation = gql`
  mutation DeleteWorkspace($name: String!, $namespace: String, $dryRun: Boolean) {
    core_openmcp_cloud {
      v1alpha1 {
        deleteWorkspace(name: $name, namespace: $namespace, dryRun: $dryRun)
      }
    }
  }
`;

export function useDeleteWorkspace(projectNamespace: string, workspaceName: string) {
  const { t } = useTranslation();
  const toast = useToast();
  const [deleteWorkspaceMutation] = useMutation(DeleteWorkspaceMutation);

  const deleteWorkspace = useCallback(async (): Promise<void> => {
    await deleteWorkspaceMutation({
      variables: {
        name: workspaceName,
        namespace: projectNamespace,
      },
    });
    toast.show(t('ControlPlaneListWorkspaceGridTile.deleteConfirmationDialog'));
  }, [deleteWorkspaceMutation, projectNamespace, toast, t, workspaceName]);

  return {
    deleteWorkspace,
  };
}
