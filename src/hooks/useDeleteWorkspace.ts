import { useCallback } from 'react';
import { useApolloClient } from '@apollo/client/react';
import { useApiResourceMutation } from '../lib/api/useApiResource';
import { DeleteWorkspaceResource, DeleteWorkspaceType } from '../lib/api/types/crate/deleteWorkspace';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { GetWorkspacesDocument } from '../types/__generated__/graphql/graphql';

export function useDeleteWorkspace(projectNamespace: string, workspaceName: string) {
  const { t } = useTranslation();
  const toast = useToast();
  const apolloClient = useApolloClient();

  const { trigger } = useApiResourceMutation<DeleteWorkspaceType>(
    DeleteWorkspaceResource(projectNamespace, workspaceName),
  );

  const deleteWorkspace = useCallback(async (): Promise<void> => {
    await trigger();
    await apolloClient.refetchQueries({ include: [GetWorkspacesDocument] });
    toast.show(t('ControlPlaneListWorkspaceGridTile.deleteConfirmationDialog'));
  }, [trigger, apolloClient, toast, t]);

  return {
    deleteWorkspace,
  };
}
