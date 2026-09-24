import { useCallback, useEffect, useRef } from 'react';
import { CreateProjectWorkspaceDialog, OnCreatePayload } from './CreateProjectWorkspaceDialog.tsx';
import { projectnameToNamespace } from '../../utils';
import { useAuthOnboarding as _useAuthOnboarding } from '../../spaces/onboarding/auth/AuthContextOnboarding.tsx';
import { Member, MemberRoles } from '../../lib/api/types/shared/members.ts';
import { useTranslation } from 'react-i18next';
import { useWatch } from 'react-hook-form';
import { ComponentsListItem } from '../../lib/api/types/crate/createManagedControlPlane.ts';
import { useCreateWorkspace as _useCreateWorkspace } from '../../spaces/onboarding/hooks/useCreateWorkspace.ts';
import { ErrorDialogHandle } from '../Shared/ErrorMessageBox.tsx';
import { extractErrorMessage } from '../../lib/api/error.ts';
import { useTelemetry } from '../../lib/telemetry/telemetry.ts';
import { useProjectForm } from './useProjectForm.ts';

export type CreateDialogProps = {
  name: string;
  displayName?: string;
  chargingTarget?: string;
  chargingTargetType?: string;
  members: Member[];
  componentsList?: ComponentsListItem[];
  supportServiceIds?: string;
  supportLandscape?: string;
  supportSecurityContacts?: string;
  supportOpsContacts?: string;
};

const DEFAULT_VALUES: CreateDialogProps = {
  name: '',
  displayName: '',
  chargingTarget: '',
  members: [],
  chargingTargetType: '',
};

export function CreateWorkspaceDialogContainer({
  isOpen,
  setIsOpen,
  project = '',
  useCreateWorkspace = _useCreateWorkspace,
  useAuthOnboarding = _useAuthOnboarding,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  project?: string;
  useCreateWorkspace?: typeof _useCreateWorkspace;
  useAuthOnboarding?: typeof _useAuthOnboarding;
}) {
  const { t } = useTranslation();
  const telemetry = useTelemetry();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isValid },
    watch,
    control,
  } = useProjectForm(DEFAULT_VALUES);
  const members = useWatch({ control, name: 'members' });
  const { user } = useAuthOnboarding();

  const username = user?.email;
  const namespace = projectnameToNamespace(project);

  const { createWorkspace, isLoading } = useCreateWorkspace(namespace);
  const errorDialogRef = useRef<ErrorDialogHandle>(null);

  useEffect(() => {
    if (username) {
      setValue('members', [{ name: username, roles: [MemberRoles.admin], kind: 'User' }], { shouldValidate: true });
    }
    if (!isOpen) {
      reset();
    }
  }, [setValue, username, isOpen, reset]);

  const handleWorkspaceCreate = useCallback(
    async (payload: OnCreatePayload): Promise<boolean> => {
      try {
        await createWorkspace(payload);
        telemetry.track({ category: 'workspace', action: 'created' });
        setIsOpen(false);
        return true;
      } catch (e) {
        errorDialogRef.current?.showErrorDialog(extractErrorMessage(e));
        return false;
      }
    },
    [createWorkspace, setIsOpen, telemetry],
  );

  return (
    <CreateProjectWorkspaceDialog
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      errorDialogRef={errorDialogRef}
      titleText={t('CreateProjectWorkspaceDialog.createWorkspaceTitle')}
      members={members}
      form={{ register, errors, setValue, watch, handleSubmit }}
      isMetadataValid={isValid}
      isLoading={isLoading}
      type={'workspace'}
      projectName={project}
      // eslint-disable-next-line react-hooks/refs
      onCreate={handleSubmit(handleWorkspaceCreate)}
    />
  );
}
