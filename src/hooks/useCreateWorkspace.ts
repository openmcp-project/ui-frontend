import { useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { useToast } from '../context/ToastContext';
import { Member } from '../lib/api/types/shared/members';
import { useTranslation } from 'react-i18next';
import { CHARGING_TARGET_LABEL, CHARGING_TARGET_TYPE_LABEL, DISPLAY_NAME_ANNOTATION } from '../lib/api/types/shared/keyNames';
import { WorkspaceInput } from '../types/__generated__/graphql/graphql';
import { graphql } from '../types/__generated__/graphql/index';

export interface CreateWorkspaceParams {
  name: string;
  displayName?: string;
  chargingTarget?: string;
  chargingTargetType?: string;
  members: Member[];
}

function buildWorkspaceInput(namespace: string, params: CreateWorkspaceParams): WorkspaceInput {
  return {
    apiVersion: 'core.openmcp.cloud/v1alpha1',
    kind: 'Workspace',
    metadata: {
      name: params.name,
      namespace,
      annotations: {
        [DISPLAY_NAME_ANNOTATION]: params.displayName ?? '',
      },
      labels: {
        [CHARGING_TARGET_TYPE_LABEL]: params.chargingTargetType ?? '',
        [CHARGING_TARGET_LABEL]: params.chargingTarget ?? '',
      },
    },
    spec: {
      members: params.members.map((member) => ({
        kind: member.kind,
        name: member.name,
        namespace: member.kind === 'ServiceAccount' ? (member.namespace ?? 'default') : undefined,
        roles: member.roles,
      })),
    },
  };
}

const CreateWorkspaceMutation = graphql(`
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
`);

export function useCreateWorkspace(namespace: string) {
  const { t } = useTranslation();
  const toast = useToast();
  const [createWorkspaceMutation] = useMutation(CreateWorkspaceMutation);

  const createWorkspace = useCallback(
    async (params: CreateWorkspaceParams): Promise<void> => {
      const object = buildWorkspaceInput(namespace, params);

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
