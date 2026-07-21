import { useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../context/ToastContext';
import {
  CHARGING_TARGET_LABEL,
  CHARGING_TARGET_TYPE_LABEL,
  DISPLAY_NAME_ANNOTATION,
  GITHUB_APP_INSTALLATION_ANNOTATION,
} from '../../../lib/api/types/shared/keyNames';
import { graphql } from '../../../types/__generated__/graphql';
import type { CoreOpenmcpCloudV1alpha1Project_Input as ProjectInput } from '../../../types/__generated__/graphql/graphql';
import { ProjectData } from './useGetProject';

const UpdateProjectMutation = graphql(`
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
`);

function buildInput(projectData: ProjectData, installationId: string): ProjectInput {
  return {
    apiVersion: 'core.openmcp.cloud/v1alpha1',
    kind: 'Project',
    metadata: {
      name: projectData.name,
      annotations: {
        [DISPLAY_NAME_ANNOTATION]: projectData.displayName ?? '',
        [GITHUB_APP_INSTALLATION_ANNOTATION]: installationId,
      },
      labels: {
        [CHARGING_TARGET_TYPE_LABEL]: projectData.chargingTargetType ?? '',
        [CHARGING_TARGET_LABEL]: projectData.chargingTarget ?? '',
      },
    },
    spec: {
      members: projectData.members.map((member) => ({
        kind: member.kind,
        name: member.name,
        namespace: member.kind === 'ServiceAccount' ? (member.namespace ?? 'default') : undefined,
        roles: member.roles,
      })),
    },
  };
}

export function useConnectGitHub() {
  const { t } = useTranslation();
  const toast = useToast();
  const [updateProjectMutation, { loading }] = useMutation(UpdateProjectMutation);

  const previewConnect = useCallback(
    async (projectData: ProjectData, installationId: string): Promise<void> => {
      const object = buildInput(projectData, installationId);
      await updateProjectMutation({
        variables: { name: projectData.name, object, dryRun: true },
      });
    },
    [updateProjectMutation],
  );

  const confirmConnect = useCallback(
    async (projectData: ProjectData, installationId: string): Promise<void> => {
      const object = buildInput(projectData, installationId);
      await updateProjectMutation({
        variables: { name: projectData.name, object, dryRun: false },
      });
      toast.show(t('ConnectGitHubDialog.connectedToast'));
    },
    [updateProjectMutation, toast, t],
  );

  return { previewConnect, confirmConnect, isLoading: loading };
}
