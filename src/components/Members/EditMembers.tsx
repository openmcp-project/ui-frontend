import { FC, useRef, useState, useCallback } from 'react';
import { Button, Dialog, FlexBox, Input, InputDomRef, Label } from '@ui5/webcomponents-react';
import { MemberTable } from './MemberTable.tsx';

import { Member, MemberRoles, memberRolesOptions } from '../../lib/api/types/shared/members';
import { useTranslation } from 'react-i18next';
import styles from './Members.module.css';
import { RadioButtonsSelect, RadioButtonsSelectOption } from '../Ui/RadioButtonsSelect/RadioButtonsSelect.tsx';
import { ValueState } from '../Shared/Ui5ValieState.tsx';

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
  const [accountType, setAccountType] = useState('user');
  const emailInputRef = useRef<InputDomRef>(null);
  const [emailState, setEmailState] = useState<ValueState>('None');
  const [emailMessage, setEmailMessage] = useState('');
  const [namespace, setNamespace] = useState('');
  const [selectedRole, setSelectedRole] = useState(MemberRoles.viewer as string);
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
    // onMemberChanged([...members, { name: email, roles: [selectedRole], kind: 'User' }]);
    if (input) input.value = '';
  }, [members, onMemberChanged, selectedRole, t]);

  const handleRemoveMember = useCallback(
    (email: string) => {
      onMemberChanged(members.filter((m) => m.name !== email));
    },
    [members, onMemberChanged],
  );

  const handleRoleChange = useCallback((role: string) => {
    setSelectedRole(role);
  }, []);

  const handleEmailInputChange = useCallback(() => {
    setEmailState('None');
    setEmailMessage('');
  }, []);

  const handleOpenMemberFormDialog = () => {
    setIsMemberDialogOpen(true);
  };
  const handleAccontTypeChange = (value: string) => {
    setAccountType(value);
  };
  const accountTypes: RadioButtonsSelectOption[] = [
    { value: 'user', label: 'User account', icon: 'employee' },
    { value: 'service-account', label: 'Service Account', icon: 'subway-train' },
  ];
  return (
    <FlexBox direction="Column" gap={8}>
      <Dialog open={isMemberDialogOpen} headerText={'Add member'}>
        <div className={styles.container}>
          <FlexBox alignItems="Stretch" direction={'Column'}>
            <FlexBox direction="Column" alignItems="Stretch" className={styles.wrapper}>
              <Label for="member-email-input">{t('common.name')}</Label>
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
            {/*<MemberRoleSelect value={selectedRole} onChange={handleRoleChange} />*/}
            <div className={styles.wrapper}>
              <RadioButtonsSelect
                selectedValue={selectedRole}
                options={memberRolesOptions}
                handleOnClick={handleRoleChange}
                label={t('MemberTable.columnRoleHeader')}
              />
            </div>
            <FlexBox alignItems={'Baseline'} direction={'Column'} className={styles.wrapper}>
              <FlexBox alignItems={'Baseline'} justifyContent={'SpaceBetween'}>
                <RadioButtonsSelect
                  label={'Account type:'}
                  selectedValue={accountType}
                  options={accountTypes}
                  handleOnClick={handleAccontTypeChange}
                />
              </FlexBox>
            </FlexBox>
            <div className={styles.placeholder}>
              <FlexBox direction="Column">
                {accountType === 'service-account' && (
                  <>
                    <Label for="namespace-input">Namespace</Label>
                    <Input
                      type="Text"
                      value={accountType === 'service-account' ? namespace : ''}
                      disabled={accountType !== 'service-account'}
                      // ref={namespaceInputRef}
                      data-testid="namespace-input"
                      id="namespace-input"
                      onChange={(event) => {
                        setNamespace(event.target.value);
                      }}
                      // valueState={namespaceState}
                      // valueStateMessage={<span>{emailMessage}</span>}

                      // onInput={handleEmailInputChange}
                    />
                  </>
                )}
              </FlexBox>
            </div>

            <Button className={styles.wrapper}>{t('buttons.cancel')}</Button>
            <Button
              className={styles.addButton}
              data-testid="add-member-button"
              design={'Emphasized'}
              icon={'sap-icon://add-employee'}
              onClick={handleAddMember}
            >
              {t('EditMembers.addButton')}
            </Button>
          </FlexBox>
        </div>
      </Dialog>
      <Button
        className={styles.addButton}
        data-testid="add-member-button"
        design="Emphasized"
        icon={'sap-icon://add-employee'}
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
