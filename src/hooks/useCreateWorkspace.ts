import { useCallback } from 'react';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { CreateWorkspace, CreateWorkspaceType } from '../lib/api/types/crate/createWorkspace';
import { useToast } from '../context/ToastContext';
import { Member } from '../lib/api/types/shared/members';
import { useTranslation } from 'react-i18next';
import { WorkspaceInput } from '../types/__generated__/graphql/graphql';

export interface CreateWorkspaceParams {
  name: string;
  displayName?: string;
  chargingTarget?: string;
  chargingTargetType?: string;
  members: Member[];
}

const CreateWorkspaceMutation = gql`
  mutation CreateWorkspace($namespace: String!, $object: WorkspaceInput!, $dryRun: Boolean) {
    core_openmcp_cloud {
      v1alpha1 {
        createWorkspace(namespace: $namespace, object: $object, dryRun: $dryRun) {
          metadata {
            name
            namespace
          }
        }
      }
    }
  }
`;

export function useCreateWorkspace(namespace: string) {
  const { t } = useTranslation();
  const toast = useToast();
  const [createWorkspaceMutation] = useMutation(CreateWorkspaceMutation);

  const createWorkspace = useCallback(
    async ({
      name,
      displayName,
      chargingTarget,
      chargingTargetType,
      members,
    }: CreateWorkspaceParams): Promise<void> => {
      const object = CreateWorkspace(name, namespace, {
        displayName,
        chargingTarget,
        chargingTargetType,
        members,
      }) as CreateWorkspaceType as WorkspaceInput;

      await createWorkspaceMutation({
        variables: {
          namespace,
          object,
        },
      });
      toast.show(t('CreateWorkspaceDialog.toastMessage'));
    },
    [createWorkspaceMutation, toast, t, namespace],
  );

  return {
    createWorkspace,
  };
}
