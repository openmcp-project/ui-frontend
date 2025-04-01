import {
  Bar,
  Button,
  Dialog,
  Form,
  FormGroup,
  FormItem,
  Input,
  Label,
} from '@ui5/webcomponents-react';

import { Member } from '../../lib/api/types/shared/members';
import { ErrorDialog, ErrorDialogHandle } from '../Shared/ErrorMessageBox.tsx';

import { FormEvent } from 'react';
import { KubectlInfoButton } from './KubectlCommandInfo/KubectlInfoButton.tsx';
import { KubectlWorkspaceDialog } from './KubectlCommandInfo/KubectlCreateWorkspaceDialog.tsx';
import { KubectlProjectDialog } from './KubectlCommandInfo/KubectlCreateProjectDialog.tsx';

import { EditMembers } from '../Members/EditMembers.tsx';
// import { useFrontendConfig } from '../../context/FrontendConfigContext.tsx';
import { useTranslation } from 'react-i18next';
import { useDialog } from './UseDialog.tsx';

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
  const kubectlDialog = useDialog();
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
                <KubectlInfoButton onClick={kubectlDialog.open} />
                <Button onClick={() => setIsOpen(false)}>
                  {' '}
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
      <KubectlWorkspaceDialog
        project={projectName}
        isOpen={kubectlDialog.isOpen && !!projectName}
        onClose={kubectlDialog.close}
      />
      <KubectlProjectDialog
        isOpen={kubectlDialog.isOpen && !projectName}
        onClose={kubectlDialog.close}
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
      <FormGroup headerText={t('CreateProjectWorkspaceDialog.metadataHeader')}>
        <FormItem
          labelContent={
            <Label required>
              {t('CreateProjectWorkspaceDialog.nameLabel')}
            </Label>
          }
        >
          <Input
            id="name"
            {...register('name')}
            valueState={errors.name ? 'Negative' : 'None'}
            valueStateMessage={<span>{errors.name?.message}</span>}
            required
          />
        </FormItem>

        <FormItem
          labelContent={
            <Label>{t('CreateProjectWorkspaceDialog.displayNameLabel')}</Label>
          }
        >
          <Input id="displayName" {...register('displayName')} />
        </FormItem>
        <FormItem
          labelContent={
            <Label>
              {t('CreateProjectWorkspaceDialog.chargingTargetLabel')}
            </Label>
          }
        >
          <Input id="chargingTarget" {...register('chargingTarget')} />
        </FormItem>
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
