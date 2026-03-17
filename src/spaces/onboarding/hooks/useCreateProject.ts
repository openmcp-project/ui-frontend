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
import { ProjectInput } from '../../../types/__generated__/graphql/graphql';
import { graphql } from '../../../types/__generated__/graphql/index';

export interface CreateProjectParams {
  name: string;
  displayName?: string;
  chargingTarget?: string;
  chargingTargetType?: string;
  members: Member[];
}

function buildProjectInput(params: CreateProjectParams): ProjectInput {
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
      members: params.members.map((member) => ({
        kind: member.kind,
        name: member.name,
        namespace: member.kind === 'ServiceAccount' ? (member.namespace ?? 'default') : undefined,
        roles: member.roles,
      })),
    },
  };
}

const CreateProjectMutation = graphql(`
  mutation CreateProject($object: ProjectInput!, $dryRun: Boolean) {
    core_openmcp_cloud {
      v1alpha1 {
        createProject(object: $object, dryRun: $dryRun) {
          metadata {
            name
          }
        }
      }
    }
  }
`);

export function useCreateProject() {
  const { t } = useTranslation();
  const toast = useToast();
  const [createProjectMutation] = useMutation(CreateProjectMutation);

  const createProject = useCallback(
    async (params: CreateProjectParams): Promise<void> => {
      const object = buildProjectInput(params);

      await createProjectMutation({
        variables: {
          object,
        },
      });
      toast.show(t('CreateProjectDialog.toastMessage'));
    },
    [createProjectMutation, toast, t],
  );

  return {
    createProject,
  };
}
