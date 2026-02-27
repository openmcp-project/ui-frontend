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

function transformToWorkspaceInput(workspace: CreateWorkspaceType): WorkspaceInput {
  return {
    apiVersion: workspace.apiVersion,
    kind: workspace.kind,
    metadata: {
      name: workspace.metadata.name,
      namespace: workspace.metadata.namespace,
      annotations: workspace.metadata.annotations,
      labels: workspace.metadata.labels,
    },
    spec: {
      members: workspace.spec.members.map((member) => ({
        kind: member.kind,
        name: member.name,
        namespace: member.namespace,
        roles: member.roles,
      })),
    },
  };
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
      const workspaceData = CreateWorkspace(name, namespace, {
        displayName,
        chargingTarget,
        chargingTargetType,
        members,
      });

      const object = transformToWorkspaceInput(workspaceData);

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
