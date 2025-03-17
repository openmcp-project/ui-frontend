import { useRef, useState} from "react";
import {Button, Input, InputDomRef} from "@ui5/webcomponents-react";
import {MemberTable} from "./MemberTable.tsx";
import {MemberRoleSelect} from "./MemberRoleSelect.tsx";
import {ValueState} from "../Shared/Ui5ValieState.tsx";
import {Member, MemberRoles} from "../../lib/api/types/shared/members";
import {useTranslation} from "react-i18next";
import {z} from "zod";

export interface EditMembersProps {
  members: Member[];
  onMemberChanged: (members: Member[]) => void;
}

export function EditMembers({members = [], onMemberChanged}: EditMembersProps) {
  const emailInput = useRef<InputDomRef>(null);
  const [valueStateMessage, setValueStateMessage] = useState<string>("");
  const [highlightEmail, setHighlightEmail] = useState<ValueState>("None");
  const [role, setRole] = useState(MemberRoles.viewer);
  const {t} = useTranslation();

  const addMember = () => {
    setValueStateMessage("")
    setHighlightEmail("None");
    if (!emailInput.current) {
      return;
    }
    // Check if the email is already in the list,  highlight as error
    if (members.find((m) => m.name === emailInput.current!.value)) {
      setValueStateMessage("User with this email already exists!")
      setHighlightEmail("Negative");
      return;
    }
    if (!z.string().email().safeParse(emailInput.current!.value).success) {
      setValueStateMessage("This is not a valid email.")
      setHighlightEmail("Negative");
      return;
    }
    const newMembers = [...members, {name: emailInput.current.value, roles: [role], kind: "User"}]
    onMemberChanged(newMembers);
    emailInput.current!.value = "";
  }
  const removeMember = (email: string) => {
    const newMembers = members.filter((m) => m.name !== email);
    onMemberChanged(newMembers);
  }

  const changeSelectedRole = (role: MemberRoles) => {
    setRole(role);
  }


  return (
    <>
      <div>
        <Input id="member-email-input" type="Email" placeholder="Email" ref={emailInput} valueState={highlightEmail}
               valueStateMessage={<span>{valueStateMessage}</span>} onChange={()=>{ setHighlightEmail('None')}}></Input>
        <MemberRoleSelect value={role} onChange={changeSelectedRole}/>
        <Button data-testid="add-member-button" onClick={() => addMember()}>{t('EditMembers.addButton')}</Button>
        <MemberTable members={members} onDeleteMember={removeMember}/>
      </div>
    </>
  )
}