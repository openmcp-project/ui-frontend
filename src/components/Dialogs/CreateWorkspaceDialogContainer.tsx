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
import {Member, MemberRoles, MemberSchema} from "../../lib/api/types/shared/members.ts";

import {useTranslation} from "react-i18next";

import {z} from "zod";

import {zodResolver} from "@hookform/resolvers/zod";
import {useForm} from "react-hook-form";


export type CreateDialogProps = {
  name: string,
  displayName: string,
  chargingTarget: string,
  members: Member[],
}


export function CreateWorkspaceDialogContainer({
                                                 isOpen,
                                                 setIsOpen,
                                                 project = '',
  type
                                               }: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  project?: string;
  type: 'workspace' | 'project'

}) {
  const validationSchema = z.object({
    name: z.string().min(1, "Name is required").regex(/^(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(?:\.(?!-)[a-zA-Z0-9-]{1,63}(?<!-))*$/, 'Invalid'),
    displayName: z.string().optional(),
    chargingTarget: z.string().optional(),
    members: z.array(MemberSchema).nonempty()
  });




  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
    watch
  } = useForm<CreateDialogProps>({
    // @ts-ignore
    resolver: zodResolver(validationSchema, ),
    defaultValues: {
      name: "",
      displayName: "",
      chargingTarget: "",
      members: [],
    }
  });

  const username = useAuthSubject()

  const {t} = useTranslation();

  useEffect(() => {
    if (username) {
      setValue('members', [{name: username, roles: [MemberRoles.admin], kind: "User"}])
    }
    return () => {
      reset()

    };
  }, []);
  const namespace = projectnameToNamespace(project);
  const toast = useToast();

  const {trigger} = useApiResourceMutation<CreateWorkspaceType>(CreateWorkspaceResource(namespace));
  const revalidate = useRevalidateApiResource(ListWorkspaces(project));
  const errorDialogRef = useRef<ErrorDialogHandle>(null);

  const handleWorkspaceCreate = async ({
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


      <CreateProjectWorkspaceDialog
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        onCreate={handleSubmit(type === "workspace" ? handleWorkspaceCreate : ()=> {})}
        errorDialogRef={errorDialogRef}
        titleText="Create Workspace"
        members={watch('members')}
        register={register}
        errors={errors}
        setValue={setValue}
      />

  );
}
