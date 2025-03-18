// import {useEffect, useRef, useState} from 'react';
// import {useApiResourceMutation} from "../../lib/api/useApiResource";
// import {CreateProject, CreateProjectResource, CreateProjectType} from "../../lib/api/types/crate/createProject";
// import {ErrorDialogHandle} from "../Shared/ErrorMessageBox.tsx";
// import {APIError} from "../../lib/api/error";
// import {CreateProjectWorkspaceDialog, onCreatePayload} from "./CreateProjectWorkspaceDialog.tsx";
// import {useToast} from '../../context/ToastContext.tsx';
// import {useAuthSubject} from "../../lib/oidc/useUsername.ts";
// import {Member, MemberRoles} from "../../lib/api/types/shared/members.ts";
// import {InputDomRef} from "@ui5/webcomponents-react";
// import {useTranslation} from "react-i18next";
//
// import {CreateDialogProps} from "./CreateWorkspaceDialogContainer.tsx";
//
//
// export function CreateProjectDialogContainer({isOpen, setIsOpen}: { isOpen: boolean, setIsOpen: (isOpen: boolean) => void }) {
//   const {trigger} = useApiResourceMutation<CreateProjectType>(CreateProjectResource())
//   const toast = useToast();
//   const errorDialogRef = useRef<ErrorDialogHandle>(null);
//   const {t} = useTranslation();
//
//   const handleProjectCreate = async ({
//                                        name,
//                                        chargingTarget,
//                                        displayName,
//                                        members
//                                      }: onCreatePayload): Promise<Boolean> => {
//     try {
//       await trigger(CreateProject(name, {
//         displayName: displayName,
//         chargingTarget: chargingTarget,
//         members: members
//       }));
//       setIsOpen(false);
//       toast.show(t('CreateProjectDialog.toastMessage'));
//       return true;
//     } catch (e) {
//       console.error(e);
//       if (e instanceof APIError) {
//         if (errorDialogRef.current) {
//           errorDialogRef.current.showErrorDialog(`${e.message}: ${JSON.stringify(e.info)}`);
//         }
//       }
//       return false;
//     }
//   }
//
//   const username = useAuthSubject();
//   const [members, setMembers] = useState<Member[]>([]);
//   const nameInput = useRef<InputDomRef>(null);
//   const displayNameInput = useRef<InputDomRef>(null);
//   const chargingTargetInput = useRef<InputDomRef>(null);
//
//   useEffect(() => {
//     if (username) {
//       setMembers([{name: username, roles: [MemberRoles.admin], kind: "User"}]);
//     }
//     return () => {
//       if (nameInput.current) {
//         nameInput.current.value = "";
//       }
//       if (displayNameInput.current) {
//         displayNameInput.current.value = "";
//       }
//       if (chargingTargetInput.current) {
//         chargingTargetInput.current.value = "";
//       }
//       setMembers([]);
//     };
//   }, []);
//   const formik = useFormik<CreateDialogProps>(
//     {
//       initialValues: {
//         name: "",
//         displayName: "",
//         chargingTarget: "",
//         members: [],
//       },
//       onSubmit: (values, ) => {
//         console.log(values)
//       }
//     });
//   const handleOnCreate = async () => {
//     if (!nameInput.current || !displayNameInput.current || !chargingTargetInput.current) {
//       return;
//     }
//     const successful = await handleProjectCreate({
//       name: nameInput.current.value,
//       displayName: displayNameInput.current.value,
//       chargingTarget: chargingTargetInput.current.value,
//       members: members,
//     });
//     if (successful) {
//       nameInput.current.value = "";
//       displayNameInput.current.value = "";
//       chargingTargetInput.current.value = "";
//     }
//   };
//
//   return (
//     <>
//       <CreateProjectWorkspaceDialog isOpen={isOpen} setIsOpen={setIsOpen} onCreate={handleOnCreate}
//                                     errorDialogRef={errorDialogRef} titleText="Create Project"
//                                     members={members}
//
//
//
//
//       />
//     </>
//   )
// }
//
//
//
//
//
