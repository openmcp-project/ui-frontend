import { useCallback } from 'react';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useToast } from '../../../context/ToastContext';
import { Member } from '../../../lib/api/types/shared/members';
import { useTranslation } from 'react-i18next';
import {
  CHARGING_TARGET_LABEL,
  CHARGING_TARGET_TYPE_LABEL,
  DISPLAY_NAME_ANNOTATION,
} from '../../../lib/api/types/shared/keyNames';
import {
  CoreOpenmcpCloudV1alpha1Project_Input as ProjectInput,
  Io_K8s_Apimachinery_Pkg_Apis_Meta_V1_ObjectMetaMetadata_Input as ObjectMetaInput,
} from '../../../types/__generated__/graphql/graphql';
import { CreateProjectParams } from './useCreateProject';

const UpdateProjectMutation = gql`
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
`;

export interface UpdateProjectParams extends CreateProjectParams {
  /**
   * Full metadata object as returned by the server. Spread into the update payload
   * so that fields the form doesn't own (finalizers, ownerReferences, resourceVersion,
   * extra annotations/labels set by external tools) are preserved rather than silently dropped.
   */
  existingMetadata?: ObjectMetaInput;
}

function buildUpdateProjectInput(params: UpdateProjectParams): ProjectInput {
  return {
    apiVersion: 'core.openmcp.cloud/v1alpha1',
    kind: 'Project',
    metadata: {
      ...params.existingMetadata,
      name: params.name,
      annotations: {
        ...(params.existingMetadata?.annotations as Record<string, string> | null | undefined),
        [DISPLAY_NAME_ANNOTATION]: params.displayName ?? '',
      },
      labels: {
        ...(params.existingMetadata?.labels as Record<string, string> | null | undefined),
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
    async (params: UpdateProjectParams): Promise<void> => {
      try {
        const object = buildUpdateProjectInput(params);
        await updateProjectMutation({
          variables: {
            name: params.name,
            object,
          },
        });
        toast.show(t('EditProjectDialog.toastMessage'));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        toast.show(message);
        throw error;
      }
    },
    [updateProjectMutation, toast, t],
  );

  return { updateProject };
}
