import { Bar, Button, Dialog, FormGroup } from '@ui5/webcomponents-react';

import { Member } from '../../lib/api/types/shared/members';
import { ErrorDialog, ErrorDialogHandle } from '../Shared/ErrorMessageBox.tsx';

import { FormEvent, useState } from 'react';
import { KubectlInfoButton } from './KubectlCommandInfo/KubectlInfoButton.tsx';
import { KubectlCreateWorkspaceDialog } from './KubectlCommandInfo/KubectlCreateWorkspaceDialog.tsx';
import { KubectlCreateProjectDialog } from './KubectlCommandInfo/KubectlCreateProjectDialog.tsx';

import { EditMembers } from '../Members/EditMembers.tsx';

import { useTranslation } from 'react-i18next';

import { CreateDialogProps } from './CreateWorkspaceDialogContainer.tsx';
import { FieldErrors, UseFormWatch, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { MetadataForm } from './MetadataForm.tsx';

export type OnCreatePayload = {
  name: string;
  displayName?: string;
  chargingTarget?: string;
  chargingTargetType?: string;
  members: Member[];
};

export interface CreateProjectWorkspaceDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  titleText: string;
  onCreate: (e?: FormEvent<HTMLFormElement> | undefined) => void;
  errorDialogRef: React.RefObject<ErrorDialogHandle | null>;
  members: Member[];
  register: UseFormRegister<CreateDialogProps>;
  errors: FieldErrors<CreateDialogProps>;
  setValue: UseFormSetValue<CreateDialogProps>;
  projectName?: string;
  type: 'workspace' | 'project';
  watch: UseFormWatch<CreateDialogProps>;
}

export function CreateProjectWorkspaceDialog({
  isOpen,
  setIsOpen,
  titleText,
  onCreate,
  errorDialogRef,
  members,
  register,
  errors,
  setValue,
  projectName,
  type,
  watch,
}: CreateProjectWorkspaceDialogProps) {
  const { t } = useTranslation();
  const [isKubectlDialogOpen, setIsKubectlDialogOpen] = useState(false);

  const openKubectlDialog = () => setIsKubectlDialogOpen(true);
  const closeKubectlDialog = () => setIsKubectlDialogOpen(false);
  const setMembers = (members: Member[]) => {
    setValue('members', members);
  };

  return (
    <>
      <Dialog
        stretch={true}
        headerText={titleText}
        open={isOpen}
        initialFocus="project-name-input"
        footer={
          <Bar
            design="Footer"
            endContent={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KubectlInfoButton onClick={openKubectlDialog} />
                <Button onClick={() => setIsOpen(false)}>{t('CreateProjectWorkspaceDialog.cancelButton')}</Button>
                <Button design="Emphasized" onClick={() => onCreate()}>
                  {t('CreateProjectWorkspaceDialog.createButton')}
                </Button>
              </div>
            }
          />
        }
        onClose={() => setIsOpen(false)}
      >
        <MetadataForm
          watch={watch}
          register={register}
          errors={errors}
          setValue={setValue}
          requireChargingTarget={type === 'project'}
          sideFormContent={
            <FormGroup headerText={t('CreateProjectWorkspaceDialog.membersHeader')}>
              <EditMembers members={members} isValidationError={!!errors.members} onMemberChanged={setMembers} />
            </FormGroup>
          }
        />
      </Dialog>
      <KubectlCreateWorkspaceDialog
        project={projectName}
        isOpen={isKubectlDialogOpen && !!projectName}
        onClose={closeKubectlDialog}
      />
      <KubectlCreateProjectDialog isOpen={isKubectlDialogOpen && !projectName} onClose={closeKubectlDialog} />
      <ErrorDialog ref={errorDialogRef} />
    </>
  );
}
