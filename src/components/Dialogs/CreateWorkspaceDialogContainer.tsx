import {useEffect, useRef} from "react";
import {useApiResourceMutation, useRevalidateApiResource} from "../../lib/api/useApiResource";
import {ErrorDialogHandle} from "../Shared/ErrorMessageBox.tsx";
import {APIError} from "../../lib/api/error";
import {CreateProjectWorkspaceDialog, onCreatePayload} from "./CreateProjectWorkspaceDialog.tsx";
import {
  CreateWorkspace,
  CreateWorkspaceResource,
  CreateWorkspaceType,
} from "../../lib/api/types/crate/createWorkspace";
import {projectnameToNamespace} from "../../utils";
import {ListWorkspaces} from "../../lib/api/types/crate/listWorkspaces";
import {useToast} from "../../context/ToastContext.tsx";
import {useAuthSubject} from "../../lib/oidc/useUsername.ts";
import {Member, MemberRoles} from "../../lib/api/types/shared/members.ts";

import {useTranslation} from "react-i18next";
import {useFormik} from "formik";
import {z} from "zod";
import {toFormikValidationSchema} from "zod-formik-adapter";


export type CreateDialogProps = {
  name: string,
  displayName: string,
  chargingTarget: string,
  members: Member[],
}



export function CreateWorkspaceDialogContainer({
                                                 isOpen,
                                                 setIsOpen,
                                                 project,
                                               }: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  project: string;
}) {
  const validationSchema = z.object({
    name: z.string().min(1, "Name is required").regex(/^(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(?:\.(?!-)[a-zA-Z0-9-]{1,63}(?<!-))*$/, 'Invalid'),
    displayName: z.string().optional(),
    chargingTarget: z.string().optional(),
    members: z.array(z.any()).nonempty()
  });
  const formik = useFormik<CreateDialogProps>(
    {
    initialValues: {
      name: "",
      displayName: "",
      chargingTarget: "",
      members: [],
    },
      onSubmit: async (values,formikHelpers) => {
        const successful = await handleProjectCreate({
          name: values.name,
          displayName: values.displayName,
          chargingTarget: values.chargingTarget,
          members: values.members,
        });
        if (successful) {
          formikHelpers.setFieldValue('name', "")
          formikHelpers.setFieldValue('displayName', "")
          formikHelpers.setFieldValue('chargingTarget', "")
        }
      }
      ,
      validationSchema: toFormikValidationSchema(validationSchema),
      // validateOnChange: true,

  });

  const username = useAuthSubject()

  const {t} = useTranslation();

  useEffect(() => {
    if (username) {
      formik.setFieldValue('members', [{name: username, roles: [MemberRoles.admin], kind: "User"}])
    }
    return () => {
      formik.resetForm()

    };
  }, []);
  const namespace = projectnameToNamespace(project);
  const toast = useToast();

  const {trigger} = useApiResourceMutation<CreateWorkspaceType>(CreateWorkspaceResource(namespace));
  const revalidate = useRevalidateApiResource(ListWorkspaces(project));
  const errorDialogRef = useRef<ErrorDialogHandle>(null);

  const handleProjectCreate = async ({
                                       name,
                                       displayName,
                                       chargingTarget,
                                       members,
                                     }: onCreatePayload): Promise<Boolean> => {
    try {
      await trigger(
        CreateWorkspace(name, namespace, {
          displayName: displayName,
          chargingTarget: chargingTarget,
          members: members,
        })
      );
      await revalidate();
      setIsOpen(false);
      toast.show(t('CreateWorkspaceDialog.toastMessage'));
      return true;
    } catch (e) {
      console.error(e);
      if (e instanceof APIError) {
        if (errorDialogRef.current) {
          errorDialogRef.current.showErrorDialog(`${e.message}: ${JSON.stringify(e.info)}`);
        }
      }
      return false;
    }
  };



  return (
    <>

      <CreateProjectWorkspaceDialog
        formik={formik}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        onCreate={formik.handleSubmit}
        errorDialogRef={errorDialogRef}
        titleText="Create Workspace"
        members={formik.values.members}
      />
    </>
  );
}
