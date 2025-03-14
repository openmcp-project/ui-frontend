import { Bar, Button, Dialog, Form, FormGroup, FormItem, Input, InputDomRef, Label } from "@ui5/webcomponents-react";

import { Member } from "../../lib/api/types/shared/members";
import { ErrorDialog, ErrorDialogHandle } from "../Shared/ErrorMessageBox.tsx";

import { EditMembers } from "../Members/EditMembers.tsx";
import ButtonDesign from "@ui5/webcomponents/dist/types/ButtonDesign.js";
import { useFrontendConfig } from "../../context/FrontendConfigContext.tsx";
import { useTranslation } from "react-i18next";

export type onCreatePayload = { name: string; displayName: string; chargingTarget: string; members: Member[] };

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
  displayNameInputRef
}: CreateProjectWorkspaceDialogProps) {
  const { links } = useFrontendConfig();
  const { t } = useTranslation();
  return (
    <>
      <Dialog
        stretch={true}
        headerText={titleText}
        open={isOpen}
        onClose={() => setIsOpen(false)}
        initialFocus="project-name-input"
        footer={
          <Bar
            design="Footer"
            endContent={
              <>
                <Button
                  design={ButtonDesign.Transparent}
                  icon="sap-icon://question-mark"
                  onClick={() => {
                    window.open(
                      links.COM_PAGE_GETTING_STARTED,
                      "_blank"
                    );
                  }}
                >
                  {t('CreateProjectWorkspaceDialog.learnButton')}
                </Button>
                <Button onClick={() => setIsOpen(false)}> {t('CreateProjectWorkspaceDialog.cancelButton')}</Button>
                <Button design="Emphasized" onClick={() => onCreate()}>
                  {t('CreateProjectWorkspaceDialog.createButton')}
                </Button>
              </>
            }
          />
        }
      >
        <CreateProjectWorkspaceDialogContent
          members={members}
          setMembers={setMembers}
          nameInput={nameInputRef}
          displayNameInput={displayNameInputRef}
          chargingTargetInput={chargingTargetInputRef}
        />
      </Dialog>
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
        <FormGroup headerText={t('CreateProjectWorkspaceDialog.metadataHeader')}>
          <FormItem labelContent={<Label required>{t('CreateProjectWorkspaceDialog.nameLabel')}</Label>}>
            <Input id="project-name-input" placeholder={t('CreateProjectWorkspaceDialog.nameLabel')} ref={nameInput} required></Input>
          </FormItem>
          <FormItem labelContent={<Label>{t('CreateProjectWorkspaceDialog.displayNameLabel')}</Label>}>
            <Input id="project-displayname-input" placeholder={t('CreateProjectWorkspaceDialog.displayNameLabel')} ref={displayNameInput}></Input>
          </FormItem>
          <FormItem labelContent={<Label>{t('CreateProjectWorkspaceDialog.chargingTargetLabel')}</Label>}>
            <Input id="project-chargingtarget-input" placeholder={t('CreateProjectWorkspaceDialog.chargingTargetLabel')} ref={chargingTargetInput}></Input>
          </FormItem>
        </FormGroup>
        <FormGroup headerText={t('CreateProjectWorkspaceDialog.membersHeader')}>
          <EditMembers members={members} onMemberChanged={setMembers} />
        </FormGroup>
      </Form>
    </>
  );
}
