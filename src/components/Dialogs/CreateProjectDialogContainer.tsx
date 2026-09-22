import { useCallback, useEffect, useRef } from 'react';
import { ErrorDialogHandle } from '../Shared/ErrorMessageBox.tsx';
import { extractErrorMessage } from '../../lib/api/error.ts';
import { CreateProjectWorkspaceDialog, OnCreatePayload } from './CreateProjectWorkspaceDialog.tsx';
import { useAuthOnboarding as _useAuthOnboarding } from '../../spaces/onboarding/auth/AuthContextOnboarding.tsx';
import { MemberRoles } from '../../lib/api/types/shared/members.ts';
import { useTranslation } from 'react-i18next';
import { useWatch } from 'react-hook-form';
import { CreateDialogProps } from './CreateWorkspaceDialogContainer.tsx';
import { useCreateProject as _useCreateProject } from '../../spaces/onboarding/hooks/useCreateProject.ts';
import { useTelemetry } from '../../lib/telemetry/telemetry.ts';
import { useProjectForm } from './useProjectForm.ts';

const DEFAULT_VALUES: CreateDialogProps = {
  name: '',
  displayName: '',
  chargingTarget: '',
  chargingTargetType: 'btp',
  members: [],
};

export function CreateProjectDialogContainer({
  isOpen,
  setIsOpen,
  onProjectCreated,
  useCreateProject = _useCreateProject,
  useAuthOnboarding = _useAuthOnboarding,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onProjectCreated?: () => void;
  useCreateProject?: typeof _useCreateProject;
  useAuthOnboarding?: typeof _useAuthOnboarding;
}) {
  const { t } = useTranslation();
  const telemetry = useTelemetry();
  const {
    watch,
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useProjectForm(DEFAULT_VALUES);
  const members = useWatch({ control, name: 'members' });
  const { user } = useAuthOnboarding();

  const username = user?.email;
  const { createProject, isLoading } = useCreateProject();
  const errorDialogRef = useRef<ErrorDialogHandle>(null);

  useEffect(() => {
    if (username) {
      setValue('members', [{ name: username, roles: [MemberRoles.admin], kind: 'User' }], { shouldValidate: true });
    }
    if (!isOpen) {
      reset();
    }
  }, [setValue, username, isOpen, reset]);

  const handleProjectCreate = useCallback(
    async (payload: OnCreatePayload): Promise<boolean> => {
      try {
        await createProject(payload);
        telemetry.track({ category: 'project', action: 'created' });
        setIsOpen(false);
        onProjectCreated?.();
        return true;
      } catch (e) {
        errorDialogRef.current?.showErrorDialog(extractErrorMessage(e));
        return false;
      }
    },
    [createProject, setIsOpen, onProjectCreated, telemetry],
  );

  return (
    <CreateProjectWorkspaceDialog
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      errorDialogRef={errorDialogRef}
      titleText={t('CreateProjectWorkspaceDialog.createProjectTitle')}
      members={members}
      form={{ register, errors, setValue, watch, handleSubmit }}
      isMetadataValid={!errors.name && !errors.chargingTarget}
      isLoading={isLoading}
      type={'project'}
      // eslint-disable-next-line react-hooks/refs
      onCreate={handleSubmit(handleProjectCreate)}
    />
  );
}
