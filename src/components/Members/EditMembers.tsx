import { FC, useRef, useState, useCallback } from 'react';
import { Button, Dialog, FlexBox, Input, InputDomRef, Label, Option, Select } from '@ui5/webcomponents-react';
import { MemberTable } from './MemberTable.tsx';
import { MemberRoleSelect } from './MemberRoleSelect.tsx';
import { ValueState } from '../Shared/Ui5ValieState.tsx';
import { Member, MemberRoles, MemberRolesDetailed } from '../../lib/api/types/shared/members';
import { useTranslation } from 'react-i18next';
import styles from './Members.module.css';
export interface EditMembersProps {
  members: Member[];
  onMemberChanged: (members: Member[]) => void;
  isValidationError?: boolean;
  requireAtLeastOneMember?: boolean;
}

export const EditMembers: FC<EditMembersProps> = ({
  members,
  onMemberChanged,
  isValidationError = false,
  requireAtLeastOneMember = true,
}) => {
  const emailInputRef = useRef<InputDomRef>(null);
  const [emailState, setEmailState] = useState<ValueState>('None');
  const [emailMessage, setEmailMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState(MemberRoles.viewer);
  const { t } = useTranslation();
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const handleAddMember = useCallback(() => {
    setIsMemberDialogOpen(false);
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
    onMemberChanged([...members, { name: email, roles: [selectedRole], kind: 'User' }]);
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

  const handleOpenMemberFormDialog = () => {
    setIsMemberDialogOpen(true);
  };
  const handleTypeChange = () => {};
  const types = [
    { value: 'user', displayValue: 'User' },
    { value: 'service-account', displayValue: 'Service Account' },
  ];
  return (
    <FlexBox direction="Column" gap={8}>
      <Dialog open={isMemberDialogOpen}>
        <FlexBox alignItems="End" direction={'Column'} gap={8}>
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
          <FlexBox direction={'Column'}>
            <Label for={'type'}>{t('MemberTable.columnRoleHeader')}</Label>
            <Select id="member-role-select" onChange={handleTypeChange}>
              {types.map(({ displayValue, value }) => (
                <Option key={value} data-value={value} value={value}>
                  {displayValue}
                </Option>
              ))}
            </Select>
          </FlexBox>
          <FlexBox direction="Column">
            <Label for="namespace-input">Namespace</Label>
            <Input
              // ref={namespaceInputRef}
              id="namespace-input"
              type="Text"
              // valueState={namespaceState}
              // valueStateMessage={<span>{emailMessage}</span>}
              data-testid="namespace-input"
              // onInput={handleEmailInputChange}
            />
          </FlexBox>
          <Button
            className={styles.addButton}
            data-testid="add-member-button"
            design="Emphasized"
            onClick={handleAddMember}
          >
            {t('EditMembers.addButton')}
          </Button>
        </FlexBox>
      </Dialog>
      <Button
        className={styles.addButton}
        data-testid="add-member-button"
        design="Emphasized"
        onClick={handleOpenMemberFormDialog}
      >
        {t('EditMembers.addButton')}
      </Button>
      <MemberTable
        requireAtLeastOneMember={requireAtLeastOneMember}
        members={members}
        isValidationError={isValidationError}
        onDeleteMember={handleRemoveMember}
      />
    </FlexBox>
  );
};
