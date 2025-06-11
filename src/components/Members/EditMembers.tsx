import { FC, useRef, useState } from 'react';
import {
  Button,
  FlexBox,
  Input,
  InputDomRef,
  Label,
} from '@ui5/webcomponents-react';
import { MemberTable } from './MemberTable.tsx';
import { MemberRoleSelect } from './MemberRoleSelect.tsx';
import { ValueState } from '../Shared/Ui5ValieState.tsx';
import { Member, MemberRoles } from '../../lib/api/types/shared/members';
import { useTranslation } from 'react-i18next';

export interface EditMembersProps {
  members: Member[];
  onMemberChanged: (members: Member[]) => void;
  isValidationError?: boolean;
}

export const EditMembers: FC<EditMembersProps> = ({
  members = [],
  onMemberChanged,
  isValidationError = false,
}) => {
  const emailInput = useRef<InputDomRef>(null);
  const [valueStateMessage, setValueStateMessage] = useState<string>('');
  const [highlightEmail, setHighlightEmail] = useState<ValueState>('None');
  const [role, setRole] = useState(MemberRoles.viewer);
  const { t } = useTranslation();

  const addMember = () => {
    setValueStateMessage('');
    setHighlightEmail('None');
    if (!emailInput.current) {
      return;
    }
    // Check if the email is already in the list,  highlight as error
    if (members.find((m) => m.name === emailInput.current!.value)) {
      setValueStateMessage(t('validationErrors.userExists'));
      setHighlightEmail('Negative');
      return;
    }

    const newMembers = [
      ...members,
      { name: emailInput.current.value, roles: [role], kind: 'User' },
    ];
    onMemberChanged(newMembers);
    emailInput.current!.value = '';
  };
  const removeMember = (email: string) => {
    const newMembers = members.filter((m) => m.name !== email);
    onMemberChanged(newMembers);
  };

  const changeSelectedRole = (role: MemberRoles) => {
    setRole(role);
  };

  return (
    <>
      <div>
        <FlexBox alignItems={'End'} gap={8}>
          <FlexBox direction={'Column'}>
            <Label for={'member-email-input'}>Email</Label>
            <Input
              ref={emailInput}
              id="member-email-input"
              type="Email"
              valueState={highlightEmail}
              valueStateMessage={<span>{valueStateMessage}</span>}
              onChange={() => {
                setHighlightEmail('None');
              }}
            />
          </FlexBox>
          <MemberRoleSelect value={role} onChange={changeSelectedRole} />
          <Button data-testid="add-member-button" onClick={() => addMember()}>
            {t('EditMembers.addButton')}
          </Button>
        </FlexBox>
        <MemberTable
          members={members}
          isValidationError={isValidationError}
          onDeleteMember={removeMember}
        />
      </div>
    </>
  );
};
