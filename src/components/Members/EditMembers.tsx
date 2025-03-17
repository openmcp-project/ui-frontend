import { useRef, useState } from "react";
import { Button, Input, InputDomRef } from "@ui5/webcomponents-react";
import { MemberTable } from "./MemberTable.tsx";
import { MemberRoleSelect } from "./MemberRoleSelect.tsx";
import { ValueState } from "../Shared/Ui5ValieState.tsx";
import { Member, MemberRoles } from "../../lib/api/types/shared/members";
import { useTranslation } from "react-i18next";
import { z } from "zod";

export interface EditMembersProps {
  members: Member[];
  onMemberChanged: (members: Member[]) => void;
}
export function EditMembers({ members = [], onMemberChanged }: EditMembersProps) {
  const emailInput = useRef<InputDomRef>(null);
  const [highlightEmail, setHighlightEmail] = useState<ValueState>("None");
  const [role, setRole] = useState(MemberRoles.viewer);
  const { t } = useTranslation();

  const addMember = () => {
    setHighlightEmail("None");
    if (!emailInput.current) {
      return;
    }
    // Check if the email is already in the list,  highlight as error
    if (members.find((m) => m.name === emailInput.current!.value) || !z.string().email("This is not a valid email.").safeParse(emailInput.current!.value).success) {
      
      setHighlightEmail("Negative");
      return;
    }
    const newMembers = [...members, { name: emailInput.current.value, roles: [role], kind: "User" }]
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
        <Input id="member-email-input" type="Email" placeholder="Email" ref={emailInput} valueState={highlightEmail} ></Input>
        <MemberRoleSelect value={role} onChange={changeSelectedRole} />
        <Button data-testid="add-member-button" onClick={() => addMember()}>{t('EditMembers.addButton')}</Button>
        <MemberTable members={members} onDeleteMember={removeMember} />
      </div>
    </>
  )
}