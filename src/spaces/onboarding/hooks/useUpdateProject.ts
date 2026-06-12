import { useCallback } from 'react';
import { gql, type TypedDocumentNode } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useToast } from '../../../context/ToastContext';
import { Member } from '../../../lib/api/types/shared/members';
import { useTranslation } from 'react-i18next';
import {
  CHARGING_TARGET_LABEL,
  CHARGING_TARGET_TYPE_LABEL,
  DISPLAY_NAME_ANNOTATION,
} from '../../../lib/api/types/shared/keyNames';
import type {
  CoreOpenmcpCloudV1alpha1MutationUpdateProjectArgs as UpdateProjectMutationVariables,
  CoreOpenmcpCloudV1alpha1Project_Input as ProjectInput,
  Mutation,
} from '../../../types/__generated__/graphql/graphql';
import { CreateProjectParams } from './useCreateProject';

type UpdateProjectMutationData = Pick<Mutation, 'core_openmcp_cloud'>;

const UpdateProjectMutation = gql(`
  mutation UpdateProject($name: String!, $object: CoreOpenmcpCloudV1alpha1Project_Input!, $dryRun: Boolean) {
    core_openmcp_cloud {
      v1alpha1 {
        updateProject(name: $name, object: $object, dryRun: $dryRun) {
          metadata {
            name
          }
        }
      }
    }
  }
`) as TypedDocumentNode<UpdateProjectMutationData, UpdateProjectMutationVariables>;

function buildUpdateProjectInput(params: CreateProjectParams): ProjectInput {
  return {
    apiVersion: 'core.openmcp.cloud/v1alpha1',
    kind: 'Project',
    metadata: {
      name: params.name,
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

export function useUpdateProject() {
  const { t } = useTranslation();
  const toast = useToast();
  const [updateProjectMutation] = useMutation(UpdateProjectMutation);

  const updateProject = useCallback(
    async (params: CreateProjectParams): Promise<void> => {
      const object = buildUpdateProjectInput(params);
      await updateProjectMutation({
        variables: {
          name: params.name,
          object,
        },
      });
      toast.show(t('EditProjectDialog.toastMessage'));
    },
    [updateProjectMutation, toast, t],
  );

  return { updateProject };
}
