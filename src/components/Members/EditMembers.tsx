import { FC, useRef, useState, useCallback } from 'react';
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
  members,
  onMemberChanged,
  isValidationError = false,
}) => {
  const emailInputRef = useRef<InputDomRef>(null);
  const [emailState, setEmailState] = useState<ValueState>('None');
  const [emailMessage, setEmailMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState(MemberRoles.viewer);
  const { t } = useTranslation();

  const handleAddMember = useCallback(() => {
    setEmailState('None');
    setEmailMessage('');
    const input = emailInputRef.current;
    const email = input?.value.trim() || '';
    if (!email) {
      setEmailState('Negative');
      setEmailMessage(t('validationErrors.required'));
      return;
    }
    if (members.some((m) => m.name === email)) {
      setEmailState('Negative');
      setEmailMessage(t('validationErrors.userExists'));
      return;
    }
    onMemberChanged([
      ...members,
      { name: email, roles: [selectedRole], kind: 'User' },
    ]);
    if (input) input.value = '';
  }, [members, onMemberChanged, selectedRole, t]);

  const handleRemoveMember = useCallback(
    (email: string) => {
      onMemberChanged(members.filter((m) => m.name !== email));
    },
    [members, onMemberChanged],
  );

  const handleRoleChange = useCallback((role: MemberRoles) => {
    setSelectedRole(role);
  }, []);

  const handleEmailInputChange = useCallback(() => {
    setEmailState('None');
    setEmailMessage('');
  }, []);

  return (
    <FlexBox direction="Column" gap={8}>
      <FlexBox alignItems="End" gap={8}>
        <FlexBox direction="Column">
          <Label for="member-email-input">{t('common.members')}</Label>
          <Input
            ref={emailInputRef}
            id="member-email-input"
            type="Email"
            valueState={emailState}
            valueStateMessage={<span>{emailMessage}</span>}
            data-testid="member-email-input"
            onInput={handleEmailInputChange}
          />
        </FlexBox>
        <MemberRoleSelect value={selectedRole} onChange={handleRoleChange} />
        <Button
          data-testid="add-member-button"
          design="Emphasized"
          onClick={handleAddMember}
        >
          {t('EditMembers.addButton')}
        </Button>
      </FlexBox>
      <MemberTable
        members={members}
        isValidationError={isValidationError}
        onDeleteMember={handleRemoveMember}
      />
    </FlexBox>
  );
};
