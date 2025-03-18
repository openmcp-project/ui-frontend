import {Bar, Button, Dialog, Form, FormGroup, FormItem, Input, Label} from "@ui5/webcomponents-react";

import {Member} from "../../lib/api/types/shared/members";
import {ErrorDialog, ErrorDialogHandle} from "../Shared/ErrorMessageBox.tsx";

import {EditMembers} from "../Members/EditMembers.tsx";
import ButtonDesign from "@ui5/webcomponents/dist/types/ButtonDesign.js";
import {useFrontendConfig} from "../../context/FrontendConfigContext.tsx";
import {useTranslation} from "react-i18next";

import {CreateDialogProps} from "./CreateWorkspaceDialogContainer.tsx";
import {FormEvent} from "react";
import {FieldErrors, UseFormRegister, UseFormSetValue} from "react-hook-form";

export type onCreatePayload = { name: string; displayName: string; chargingTarget: string; members: Member[] };

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
                                             }: CreateProjectWorkspaceDialogProps) {
  const {links} = useFrontendConfig();
  const {t} = useTranslation();

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
          register={register}
          errors={errors}
          setValue={setValue}
        />
      </Dialog>
      <ErrorDialog ref={errorDialogRef}/>
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

  const {t} = useTranslation();

  const setMembers = (members: Member[]) => {
    setValue
    ('members', members);
  }
  return (

    <Form layout={"S1"}>

      <FormGroup headerText={t('CreateProjectWorkspaceDialog.metadataHeader')}>
        <FormItem labelContent={<Label required>{t('CreateProjectWorkspaceDialog.nameLabel')}</Label>}>


          <Input id="name"

                 {...register('name')}

                 valueState={errors.name ? "Negative" : "None"}
                 valueStateMessage={<span>Use A-Z, a-z, 0-9, hyphen (-), and period (.), but note that whitespace (spaces, tabs, etc.) is not allowed for proper compatibility.

</span>}
                 required></Input>


        </FormItem>
        <FormItem labelContent={<Label>{t('CreateProjectWorkspaceDialog.displayNameLabel')}</Label>}>


          <Input id="displayName"
                 {...register('displayName')}

          ></Input>

        </FormItem>
        <FormItem labelContent={<Label>{t('CreateProjectWorkspaceDialog.chargingTargetLabel')}</Label>}>


          <Input id="chargingTarget"
                 {...register('chargingTarget')}


          >

          </Input>
        </FormItem>

      </FormGroup>
      <FormGroup headerText={t('CreateProjectWorkspaceDialog.membersHeader')}>
        <EditMembers members={members} onMemberChanged={setMembers} isValidationError={!!errors.members}/>
      </FormGroup>
    </Form>

  );
}
