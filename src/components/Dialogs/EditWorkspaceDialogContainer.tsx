import { useCallback, useEffect, useRef } from 'react';
import { BusyIndicator, Dialog } from '@ui5/webcomponents-react';
import { ErrorDialog, ErrorDialogHandle } from '../Shared/ErrorMessageBox.tsx';
import { extractErrorMessage } from '../../lib/api/error.ts';
import { CreateProjectWorkspaceDialog, OnCreatePayload, Step } from './CreateProjectWorkspaceDialog.tsx';
import { useTranslation } from 'react-i18next';
import { useWatch } from 'react-hook-form';
import { CreateDialogProps } from './CreateWorkspaceDialogContainer.tsx';
import { useUpdateWorkspace as _useUpdateWorkspace } from '../../spaces/onboarding/hooks/useUpdateWorkspace.ts';
import { useGetWorkspace as _useGetWorkspace, WorkspaceData } from '../../spaces/onboarding/hooks/useGetWorkspace.ts';
import { useProjectMembers as _useProjectMembers } from '../../spaces/onboarding/hooks/useProjectMembers.ts';
import { useTelemetry } from '../../lib/telemetry/telemetry.ts';
import { useProjectForm } from './useProjectForm.ts';

function EditWorkspaceForm({
  workspaceData,
  isOpen,
  setIsOpen,
  errorDialogRef,
  onUpdate,
  projectName,
  isLoading,
  initialStep,
  useProjectMembers,
}: {
  workspaceData: WorkspaceData;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  errorDialogRef: React.RefObject<ErrorDialogHandle | null>;
  onUpdate: (payload: OnCreatePayload) => Promise<boolean>;
  projectName?: string;
  isLoading?: boolean;
  initialStep?: Step;
  useProjectMembers?: typeof _useProjectMembers;
}) {
  const { t } = useTranslation();
  const {
    watch,
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useProjectForm({
    name: workspaceData.name,
    displayName: workspaceData.displayName,
    chargingTarget: workspaceData.chargingTarget,
    chargingTargetType: workspaceData.chargingTargetType?.toLowerCase() || '',
    members: workspaceData.members,
    supportServiceIds: workspaceData.supportServiceIds,
    supportLandscape: workspaceData.supportLandscape,
    supportSecurityContacts: workspaceData.supportSecurityContacts,
    supportOpsContacts: workspaceData.supportOpsContacts,
  } as CreateDialogProps);
  const members = useWatch({ control, name: 'members' });

  return (
    <CreateProjectWorkspaceDialog
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      errorDialogRef={errorDialogRef}
      titleText={t('EditWorkspaceDialog.title')}
      members={members}
      form={{ register, errors, setValue, watch, handleSubmit }}
      type={'workspace'}
      isEditMode
      isLoading={isLoading}
      isMetadataValid={!errors.name && !errors.chargingTarget}
      projectName={projectName}
      initialStep={initialStep}
      useProjectMembers={useProjectMembers}
      onCreate={handleSubmit(onUpdate)}
    />
  );
}

export function EditWorkspaceDialogContainer({
  isOpen,
  setIsOpen,
  workspaceName,
  namespace,
  initialStep,
  useUpdateWorkspace = _useUpdateWorkspace,
  useGetWorkspace = _useGetWorkspace,
  useProjectMembers = _useProjectMembers,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  workspaceName: string;
  namespace: string;
  initialStep?: Step;
  useUpdateWorkspace?: typeof _useUpdateWorkspace;
  useGetWorkspace?: typeof _useGetWorkspace;
  useProjectMembers?: typeof _useProjectMembers;
}) {
  const { t } = useTranslation();
  const { updateWorkspace, isLoading: isSaving } = useUpdateWorkspace();
  const telemetry = useTelemetry();
  const {
    workspaceData,
    isLoading,
    error: fetchError,
  } = useGetWorkspace(isOpen ? workspaceName : undefined, isOpen ? namespace : undefined);
  const errorDialogRef = useRef<ErrorDialogHandle>(null);
  const projectName = namespace.startsWith('project-') ? namespace.slice('project-'.length) : namespace;

  useEffect(() => {
    if (fetchError) {
      errorDialogRef.current?.showErrorDialog(extractErrorMessage(fetchError));
    }
  }, [fetchError]);

  const handleWorkspaceUpdate = useCallback(
    async ({
      name,
      chargingTarget,
      displayName,
      chargingTargetType,
      members,
      supportServiceIds,
      supportLandscape,
      supportSecurityContacts,
      supportOpsContacts,
    }: OnCreatePayload): Promise<boolean> => {
      try {
        await updateWorkspace(namespace, {
          name,
          displayName,
          chargingTarget,
          chargingTargetType,
          members,
          supportServiceIds,
          supportLandscape,
          supportSecurityContacts,
          supportOpsContacts,
        });
        telemetry.track({ category: 'workspace', action: 'edited' });
        setIsOpen(false);
        return true;
      } catch (e) {
        errorDialogRef.current?.showErrorDialog(extractErrorMessage(e));
        return false;
      }
    },
    [updateWorkspace, namespace, setIsOpen, telemetry],
  );

  const showBusy = isOpen && isLoading && !fetchError;
  const showForm = isOpen && !isLoading && !fetchError && !!workspaceData;

  return (
    <>
      <Dialog open={showBusy} headerText={t('EditWorkspaceDialog.title')}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '10rem',
            padding: '2rem',
          }}
        >
          <BusyIndicator active delay={0} />
        </div>
      </Dialog>
      <ErrorDialog ref={errorDialogRef} />
      {showForm && (
        <EditWorkspaceForm
          workspaceData={workspaceData!}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          errorDialogRef={errorDialogRef}
          projectName={projectName}
          isLoading={isSaving}
          initialStep={initialStep}
          useProjectMembers={useProjectMembers}
          onUpdate={handleWorkspaceUpdate}
        />
      )}
    </>
  );
}
