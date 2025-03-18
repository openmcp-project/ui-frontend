import {Bar, Button, Dialog, Form, FormGroup, FormItem, Input, Label} from "@ui5/webcomponents-react";

import {Member} from "../../lib/api/types/shared/members";
import {ErrorDialog, ErrorDialogHandle} from "../Shared/ErrorMessageBox.tsx";

import {EditMembers} from "../Members/EditMembers.tsx";
import ButtonDesign from "@ui5/webcomponents/dist/types/ButtonDesign.js";
import {useFrontendConfig} from "../../context/FrontendConfigContext.tsx";
import {useTranslation} from "react-i18next";
import {FormikProps} from "formik";
import {CreateDialogProps} from "./CreateWorkspaceDialogContainer.tsx";
import {FormEvent} from "react";

export type onCreatePayload = { name: string; displayName: string; chargingTarget: string; members: Member[] };

export interface CreateProjectWorkspaceDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  titleText: string;
  onCreate: (e?: FormEvent<HTMLFormElement> | undefined) => void;
  errorDialogRef: React.RefObject<ErrorDialogHandle | null>;
  members: Member[];
  formik: FormikProps<CreateDialogProps>
}

export function CreateProjectWorkspaceDialog({
                                               formik,
                                               isOpen,
                                               setIsOpen,
                                               titleText,
                                               onCreate,
                                               errorDialogRef,
                                               members,

                                             }: CreateProjectWorkspaceDialogProps) {
  const {links} = useFrontendConfig();
  const {t} = useTranslation();

  console.log('formik')
  console.log(formik)
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
          formik={formik}
          members={members}
        />
      </Dialog>
      <ErrorDialog ref={errorDialogRef}/>
    </>
  );
}

interface CreateProjectWorkspaceDialogContentProps {
  members: Member[];

  formik: FormikProps<CreateDialogProps>
}

function CreateProjectWorkspaceDialogContent({
                                               members,
                                               formik
                                             }: CreateProjectWorkspaceDialogContentProps) {

  const {t} = useTranslation();

  const setMembers = (members: Member[]) => {
    formik.setFieldValue('members', members);
  }
  return (

    <Form layout={"S1"}>

      <FormGroup headerText={t('CreateProjectWorkspaceDialog.metadataHeader')}>
        <FormItem labelContent={<Label required>{t('CreateProjectWorkspaceDialog.nameLabel')}</Label>}>


          <Input id="name"

                 value={formik.values.name}
                 onChange={formik.handleChange}
                 onBlur={formik.handleBlur}
                 valueState={(formik.errors.name && formik.touched.name) ? "Negative" : "None"}
                 valueStateMessage={<span>Use A-Z, a-z, 0-9, hyphen (-), and period (.), but note that whitespace (spaces, tabs, etc.) is not allowed for proper compatibility.

</span>}
                 required></Input>


        </FormItem>
        <FormItem labelContent={<Label>{t('CreateProjectWorkspaceDialog.displayNameLabel')}</Label>}>


          <Input id="displayName"
                 value={formik.values.displayName}
                 onChange={formik.handleChange}

          ></Input>

        </FormItem>
        <FormItem labelContent={<Label>{t('CreateProjectWorkspaceDialog.chargingTargetLabel')}</Label>}>


          <Input id="chargingTarget"
                 value={formik.values.chargingTarget}
                 onChange={formik.handleChange}


          >

          </Input>
        </FormItem>

      </FormGroup>
      <FormGroup headerText={t('CreateProjectWorkspaceDialog.membersHeader')}>
        <EditMembers members={members} onMemberChanged={setMembers} isValidationError={!!formik.errors.members}/>
      </FormGroup>
    </Form>

  );
}
