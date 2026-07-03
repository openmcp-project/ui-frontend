import { useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { useToast } from '../../../context/ToastContext';
import { Member } from '../../../lib/api/types/shared/members';
import { useTranslation } from 'react-i18next';
import {
  CHARGING_TARGET_LABEL,
  CHARGING_TARGET_TYPE_LABEL,
  DISPLAY_NAME_ANNOTATION,
  SUPPORT_LANDSCAPE_ANNOTATION,
  SUPPORT_OPS_CONTACTS_ANNOTATION,
  SUPPORT_SECURITY_CONTACTS_ANNOTATION,
  SUPPORT_SERVICE_IDS_ANNOTATION,
} from '../../../lib/api/types/shared/keyNames';
import { CoreOpenmcpCloudV1alpha1Project_Input as ProjectInput } from '../../../types/__generated__/graphql/graphql';
import { graphql } from '../../../types/__generated__/graphql/index';

export interface CreateProjectParams {
  name: string;
  displayName?: string;
  chargingTarget?: string;
  chargingTargetType?: string;
  members: Member[];
  supportServiceIds?: string;
  supportLandscape?: string;
  supportSecurityContacts?: string;
  supportOpsContacts?: string;
}

export function buildProjectAnnotations(params: CreateProjectParams): Record<string, string> {
  return {
    [DISPLAY_NAME_ANNOTATION]: params.displayName ?? '',
    [SUPPORT_SERVICE_IDS_ANNOTATION]: params.supportServiceIds ?? '',
    [SUPPORT_LANDSCAPE_ANNOTATION]: params.supportLandscape ?? '',
    [SUPPORT_SECURITY_CONTACTS_ANNOTATION]: params.supportSecurityContacts ?? '',
    [SUPPORT_OPS_CONTACTS_ANNOTATION]: params.supportOpsContacts ?? '',
  };
}

function buildProjectInput(params: CreateProjectParams): ProjectInput {
  return {
    apiVersion: 'core.openmcp.cloud/v1alpha1',
    kind: 'Project',
    metadata: {
      name: params.name,
      annotations: buildProjectAnnotations(params),
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
  mutation CreateProject($object: CoreOpenmcpCloudV1alpha1Project_Input!, $dryRun: Boolean) {
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
  const [createProjectMutation, { loading }] = useMutation(CreateProjectMutation);

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
    isLoading: loading,
  };
}
