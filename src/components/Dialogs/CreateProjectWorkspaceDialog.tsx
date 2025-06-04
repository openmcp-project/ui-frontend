import {
  Bar,
  Button,
  Dialog,
  Form,
  FormGroup,
  Input,
  Label,
} from '@ui5/webcomponents-react';

import { Member } from '../../lib/api/types/shared/members';
import { ErrorDialog, ErrorDialogHandle } from '../Shared/ErrorMessageBox.tsx';
import styles from './CreateProjectWorkspaceDialog.module.css';
import { FormEvent, useState } from 'react';
import { KubectlInfoButton } from './KubectlCommandInfo/KubectlInfoButton.tsx';
import { KubectlCreateWorkspaceDialog } from './KubectlCommandInfo/KubectlCreateWorkspaceDialog.tsx';
import { KubectlCreateProjectDialog } from './KubectlCommandInfo/KubectlCreateProjectDialog.tsx';

import { EditMembers } from '../Members/EditMembers.tsx';

import { useTranslation } from 'react-i18next';

import { CreateDialogProps } from './CreateWorkspaceDialogContainer.tsx';
import { FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form';

export type OnCreatePayload = {
  name: string;
  displayName?: string;
  chargingTarget?: string;
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
}: CreateProjectWorkspaceDialogProps) {
  // const { links } = useFrontendConfig();
  const { t } = useTranslation();
  const [isKubectlDialogOpen, setIsKubectlDialogOpen] = useState(false);

  const openKubectlDialog = () => setIsKubectlDialogOpen(true);
  const closeKubectlDialog = () => setIsKubectlDialogOpen(false);

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
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <KubectlInfoButton onClick={openKubectlDialog} />
                <Button onClick={() => setIsOpen(false)}>
                  {t('CreateProjectWorkspaceDialog.cancelButton')}
                </Button>
                <Button design="Emphasized" onClick={() => onCreate()}>
                  {t('CreateProjectWorkspaceDialog.createButton')}
                </Button>
              </div>
            }
          />
        }
        onClose={() => setIsOpen(false)}
      >
        <CreateProjectWorkspaceDialogContent
          members={members}
          register={register}
          errors={errors}
          setValue={setValue}
        />
      </Dialog>
      <KubectlCreateWorkspaceDialog
        project={projectName}
        isOpen={isKubectlDialogOpen && !!projectName}
        onClose={closeKubectlDialog}
      />
      <KubectlCreateProjectDialog
        isOpen={isKubectlDialogOpen && !projectName}
        onClose={closeKubectlDialog}
      />
      <ErrorDialog ref={errorDialogRef} />
    </>
  );
}

interface CreateProjectWorkspaceDialogContentProps {
  members: Member[];
  register: UseFormRegister<CreateDialogProps>;
  errors: FieldErrors<CreateDialogProps>;
  setValue: UseFormSetValue<CreateDialogProps>;
}

function CreateProjectWorkspaceDialogContent({
  members,
  register,
  errors,
  setValue,
}: CreateProjectWorkspaceDialogContentProps) {
  const { t } = useTranslation();

  const setMembers = (members: Member[]) => {
    setValue('members', members);
  };
  return (
    <Form>
      <FormGroup
        headerText={t('CreateProjectWorkspaceDialog.metadataHeader')}
        columnSpan={12}
      >
        <Label for="name" required>
          {t('CreateProjectWorkspaceDialog.nameLabel')}
        </Label>
        <Input
          className={styles.input}
          id="name"
          {...register('name')}
          valueState={errors.name ? 'Negative' : 'None'}
          valueStateMessage={<span>{errors.name?.message}</span>}
          required
        />

        <Label for={'displayName'}>
          {t('CreateProjectWorkspaceDialog.displayNameLabel')}
        </Label>
        <Input
          id="displayName"
          {...register('displayName')}
          className={styles.input}
        />

        <Label for={'chargingTarget'}>
          {t('CreateProjectWorkspaceDialog.chargingTargetLabel')}
        </Label>
        <Input
          id="chargingTarget"
          {...register('chargingTarget')}
          className={styles.input}
        />
      </FormGroup>
      <FormGroup headerText={t('CreateProjectWorkspaceDialog.membersHeader')}>
        <EditMembers
          members={members}
          isValidationError={!!errors.members}
          onMemberChanged={setMembers}
        />
      </FormGroup>
    </Form>
  );
}
