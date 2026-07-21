import { useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { useToast } from '../../../context/ToastContext';
import { Member } from '../../../lib/api/types/shared/members';
import { useTranslation } from 'react-i18next';
import {
  CHARGING_TARGET_LABEL,
  CHARGING_TARGET_TYPE_LABEL,
  DISPLAY_NAME_ANNOTATION,
} from '../../../lib/api/types/shared/keyNames';
import { graphql } from '../../../types/__generated__/graphql';
import type { CoreOpenmcpCloudV1alpha1Workspace_Input as WorkspaceInput } from '../../../types/__generated__/graphql/graphql';
import { CreateWorkspaceParams } from './useCreateWorkspace';

const UpdateWorkspaceMutation = graphql(`
  mutation UpdateWorkspace(
    $name: String!
    $namespace: String!
    $object: CoreOpenmcpCloudV1alpha1Workspace_Input!
    $dryRun: Boolean
  ) {
    core_openmcp_cloud {
      v1alpha1 {
        updateWorkspace(name: $name, namespace: $namespace, object: $object, dryRun: $dryRun) {
          metadata {
            name
            namespace
          }
        }
      }
    }
  }
`);

function buildUpdateWorkspaceInput(namespace: string, params: CreateWorkspaceParams): WorkspaceInput {
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
      members: params.members.map((member: Member) => ({
        kind: member.kind,
        name: member.name,
        namespace: member.kind === 'ServiceAccount' ? (member.namespace ?? 'default') : undefined,
        roles: member.roles,
      })),
    },
  };
}

export function useUpdateWorkspace() {
  const { t } = useTranslation();
  const toast = useToast();
  const [updateWorkspaceMutation] = useMutation(UpdateWorkspaceMutation);

  const updateWorkspace = useCallback(
    async (namespace: string, params: CreateWorkspaceParams): Promise<void> => {
      const object = buildUpdateWorkspaceInput(namespace, params);
      await updateWorkspaceMutation({
        variables: {
          name: params.name,
          namespace,
          object,
        },
      });
      toast.show(t('EditWorkspaceDialog.toastMessage'));
    },
    [updateWorkspaceMutation, toast, t],
  );

  return { updateWorkspace };
}
