import {
  Bar,
  Button,
  Dialog,
  Form,
  FormGroup,
  FormItem,
  Input,
  InputDomRef,
  Label,
} from '@ui5/webcomponents-react';

import { Member } from '../../lib/api/types/shared/members';
import { ErrorDialog, ErrorDialogHandle } from '../Shared/ErrorMessageBox.tsx';

import { useState } from 'react';
import { KubectlInfoButton } from './KubectlCommandInfo/KubectlInfoButton.tsx';
import { KubectlWorkspaceDialog } from './KubectlCommandInfo/KubectlWorkspaceDialog.tsx';
import { KubectlProjectDialog } from './KubectlCommandInfo/KubectlProjectDialog.tsx';

import { EditMembers } from '../Members/EditMembers.tsx';
import { useFrontendConfig } from '../../context/FrontendConfigContext.tsx';
import { useTranslation } from 'react-i18next';

export type onCreatePayload = {
  name: string;
  displayName: string;
  chargingTarget: string;
  members: Member[];
};

export interface CreateProjectWorkspaceDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  titleText: string;
  onCreate: () => Promise<void>;
  errorDialogRef: React.RefObject<ErrorDialogHandle | null>;
  members: Member[];
  setMembers: (members: Member[]) => void;
  nameInputRef: React.RefObject<InputDomRef | null>;
  displayNameInputRef: React.RefObject<InputDomRef | null>;
  chargingTargetInputRef: React.RefObject<InputDomRef | null>;
  projectName?: string;
}

export function CreateProjectWorkspaceDialog({
  isOpen,
  setIsOpen,
  titleText,
  onCreate,
  errorDialogRef,
  members,
  setMembers,
  nameInputRef,
  chargingTargetInputRef,
  displayNameInputRef,
  projectName,
}: CreateProjectWorkspaceDialogProps) {
  const { links } = useFrontendConfig();
  const { t } = useTranslation();
  const [isKubectlDialogOpen, setIsKubectlDialogOpen] = useState(false);

  const handleKubectlInfoClick = () => {
    setIsKubectlDialogOpen(true);
  };
  const handleKubectlDialogClose = () => {
    setIsKubectlDialogOpen(false);
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
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <KubectlInfoButton
                  onClick={handleKubectlInfoClick}
                ></KubectlInfoButton>
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
          setMembers={setMembers}
          nameInput={nameInputRef}
          displayNameInput={displayNameInputRef}
          chargingTargetInput={chargingTargetInputRef}
        />
      </Dialog>

      {isKubectlDialogOpen &&
        (projectName ? (
          <KubectlWorkspaceDialog
            onClose={handleKubectlDialogClose}
            project={projectName}
          ></KubectlWorkspaceDialog>
        ) : (
          <KubectlProjectDialog
            onClose={handleKubectlDialogClose}
          ></KubectlProjectDialog>
        ))}
      <ErrorDialog ref={errorDialogRef} />
    </>
  );
}

interface CreateProjectWorkspaceDialogContentProps {
  members: Member[];
  setMembers: (members: Member[]) => void;
  nameInput: React.RefObject<InputDomRef | null>;
  displayNameInput: React.RefObject<InputDomRef | null>;
  chargingTargetInput: React.RefObject<InputDomRef | null>;
}

function CreateProjectWorkspaceDialogContent({
  members,
  setMembers,
  nameInput,
  displayNameInput,
  chargingTargetInput,
}: CreateProjectWorkspaceDialogContentProps) {
  const { t } = useTranslation();
  return (
    <>
      <Form>
        <FormGroup
          headerText={t('CreateProjectWorkspaceDialog.metadataHeader')}
        >
          <FormItem
            labelContent={
              <Label required>
                {t('CreateProjectWorkspaceDialog.nameLabel')}
              </Label>
            }
          >
            <Input
              ref={nameInput}
              id="project-name-input"
              placeholder={t('CreateProjectWorkspaceDialog.nameLabel')}
              required
            />
          </FormItem>
          <FormItem
            labelContent={
              <Label>
                {t('CreateProjectWorkspaceDialog.displayNameLabel')}
              </Label>
            }
          >
            <Input
              ref={displayNameInput}
              id="project-displayname-input"
              placeholder={t('CreateProjectWorkspaceDialog.displayNameLabel')}
            />
          </FormItem>
          <FormItem
            labelContent={
              <Label>
                {t('CreateProjectWorkspaceDialog.chargingTargetLabel')}
              </Label>
            }
          >
            <Input
              ref={chargingTargetInput}
              id="project-chargingtarget-input"
              placeholder={t(
                'CreateProjectWorkspaceDialog.chargingTargetLabel',
              )}
            />
          </FormItem>
        </FormGroup>
        <FormGroup headerText={t('CreateProjectWorkspaceDialog.membersHeader')}>
          <EditMembers members={members} onMemberChanged={setMembers} />
        </FormGroup>
      </Form>
    </>
  );
}
