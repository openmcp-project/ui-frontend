import { useCallback } from 'react';
import { useApolloClient } from '@apollo/client/react';
import { useApiResourceMutation } from '../lib/api/useApiResource';
import { CreateWorkspace, CreateWorkspaceResource, CreateWorkspaceType } from '../lib/api/types/crate/createWorkspace';
import { useToast } from '../context/ToastContext';
import { Member } from '../lib/api/types/shared/members';
import { useTranslation } from 'react-i18next';
import { GetWorkspacesDocument } from '../types/__generated__/graphql/graphql';

export interface CreateWorkspaceParams {
  name: string;
  displayName?: string;
  chargingTarget?: string;
  chargingTargetType?: string;
  members: Member[];
}

export function useCreateWorkspace(namespace: string) {
  const { t } = useTranslation();
  const toast = useToast();
  const apolloClient = useApolloClient();

  const { trigger } = useApiResourceMutation<CreateWorkspaceType>(CreateWorkspaceResource(namespace));

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
      await apolloClient.refetchQueries({ include: [GetWorkspacesDocument] });
      toast.show(t('CreateWorkspaceDialog.toastMessage'));
    },
    [trigger, apolloClient, toast, t, namespace],
  );

  return {
    createWorkspace,
  };
}
