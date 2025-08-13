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

const ACCOUNT_TYPES: RadioButtonsSelectOption[] = [
  { value: 'user', label: 'User account', icon: 'employee' },
  { value: 'service-account', label: 'Service Account', icon: 'subway-train' },
];

export const EditMembers: FC<EditMembersProps> = ({
  members,
  onMemberChanged,
  isValidationError = false,
  requireAtLeastOneMember = true,
}) => {
  const { t } = useTranslation();
  const emailInputRef = useRef<InputDomRef>(null);

  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [accountType, setAccountType] = useState('user');
  const [namespace, setNamespace] = useState('');
  const [selectedRole, setSelectedRole] = useState(MemberRoles.viewer as string);
  const [emailState, setEmailState] = useState<ValueState>('None');
  const [emailMessage, setEmailMessage] = useState('');

  const resetEmailValidation = useCallback(() => {
    setEmailState('None');
    setEmailMessage('');
  }, []);

  const validateEmail = useCallback(
    (email: string): boolean => {
      if (!email) {
        setEmailState('Negative');
        setEmailMessage(t('validationErrors.required'));
        return false;
      }

      if (members.some((m) => m.name === email)) {
        setEmailState('Negative');
        setEmailMessage(t('validationErrors.userExists'));
        return false;
      }

      return true;
    },
    [members, t],
  );

  const handleAddMember = useCallback(() => {
    const input = emailInputRef.current;
    const email = input?.value.trim() || '';

    if (!validateEmail(email)) {
      return;
    }

    const newMember: Member = {
      name: email,
      roles: [selectedRole],
      kind: accountType === 'service-account' ? 'ServiceAccount' : 'User',
      ...(accountType === 'service-account' && namespace && { namespace }),
    };

    onMemberChanged([...members, newMember]);

    if (input) {
      input.value = '';
    }

    setIsMemberDialogOpen(false);
    resetEmailValidation();
  }, [members, onMemberChanged, selectedRole, accountType, namespace, validateEmail, resetEmailValidation]);

  const handleRemoveMember = useCallback(
    (email: string) => {
      onMemberChanged(members.filter((m) => m.name !== email));
    },
    [members, onMemberChanged],
  );

  const handleOpenMemberFormDialog = useCallback(() => {
    setIsMemberDialogOpen(true);
  }, []);

  const handleCloseMemberFormDialog = useCallback(() => {
    setIsMemberDialogOpen(false);
    resetEmailValidation();
  }, [resetEmailValidation]);

  const handleAccountTypeChange = useCallback((value: string) => {
    setAccountType(value);
    if (value === 'user') {
      setNamespace('');
    }
  }, []);

  const handleRoleChange = useCallback((role: string) => {
    setSelectedRole(role);
  }, []);

  const handleEmailInputChange = useCallback(() => {
    resetEmailValidation();
  }, [resetEmailValidation]);

  const handleNamespaceChange = useCallback((event: any) => {
    setNamespace(event.target.value);
  }, []);

  const renderServiceAccountFields = () => {
    if (accountType !== 'service-account') {
      return null;
    }

    return (
      <FlexBox direction="Column">
        <Label for="namespace-input">Namespace</Label>
        <Input
          type="Text"
          value={namespace}
          disabled={accountType !== 'service-account'}
          data-testid="namespace-input"
          id="namespace-input"
          onChange={handleNamespaceChange}
        />
      </FlexBox>
    );
  };

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
                  options={ACCOUNT_TYPES}
                  handleOnClick={handleAccountTypeChange}
                />
              </FlexBox>
            </FlexBox>

            <div className={styles.placeholder}>{renderServiceAccountFields()}</div>

            <Button className={styles.wrapper} onClick={handleCloseMemberFormDialog}>
              {t('buttons.cancel')}
            </Button>
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
