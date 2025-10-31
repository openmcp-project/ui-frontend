import { useCallback } from 'react';
import { useApiResourceMutation } from '../lib/api/useApiResource';
import { CreateProject, CreateProjectResource, CreateProjectType } from '../lib/api/types/crate/createProject';
import { useToast } from '../context/ToastContext';
import { Member } from '../lib/api/types/shared/members';
import { useTranslation } from 'react-i18next';

export interface CreateProjectParams {
  name: string;
  displayName?: string;
  chargingTarget?: string;
  chargingTargetType?: string;
  members: Member[];
}

export function useCreateProject() {
  const { t } = useTranslation();
  const toast = useToast();

  const { trigger } = useApiResourceMutation<CreateProjectType>(CreateProjectResource());

  const createProject = useCallback(
    async ({ name, displayName, chargingTarget, chargingTargetType, members }: CreateProjectParams): Promise<void> => {
      await trigger(
        CreateProject(name, {
          displayName,
          chargingTarget,
          chargingTargetType,
          members,
        }),
      );
      toast.show(t('CreateProjectDialog.toastMessage'));
    },
    [trigger, toast, t],
  );

  return {
    createProject
  };
}
