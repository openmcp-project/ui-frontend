import {useEffect, useRef, useState} from "react";
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
import {InputDomRef} from "@ui5/webcomponents-react";
import {useTranslation} from "react-i18next";

export function CreateWorkspaceDialogContainer({
                                                 isOpen,
                                                 setIsOpen,
                                                 project,
                                               }: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  project: string;
}) {
  const username = useAuthSubject();
  const [members, setMembers] = useState<Member[]>([]);
  const nameInput = useRef<InputDomRef>(null);
  const displayNameInput = useRef<InputDomRef>(null);
  const chargingTargetInput = useRef<InputDomRef>(null);
  const {t} = useTranslation();
  useEffect(() => {
    if (username) {
      setMembers([{name: username, roles: [MemberRoles.admin], kind: "User"}]);
    }
    return () => {
      if (nameInput.current) {
        nameInput.current.value = "";
      }
      if (displayNameInput.current) {
        displayNameInput.current.value = "";
      }
      if (chargingTargetInput.current) {
        chargingTargetInput.current.value = "";
      }
      setMembers([]);
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

  const handleOnCreate = async () => {
    if (!nameInput.current || !displayNameInput.current || !chargingTargetInput.current) {
      return;
    }
    const successful = await handleProjectCreate({
      name: nameInput.current.value,
      displayName: displayNameInput.current.value,
      chargingTarget: chargingTargetInput.current.value,
      members: members,
    });
    if (successful) {
      nameInput.current.value = "";
      displayNameInput.current.value = "";
      chargingTargetInput.current.value = "";
    }
  };

  return (
    <>
      <CreateProjectWorkspaceDialog
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        onCreate={handleOnCreate}
        errorDialogRef={errorDialogRef}
        titleText="Create Workspace"
        members={members} setMembers={setMembers}
        nameInputRef={nameInput}
        displayNameInputRef={displayNameInput}
        chargingTargetInputRef={chargingTargetInput}
      />
    </>
  );
}
