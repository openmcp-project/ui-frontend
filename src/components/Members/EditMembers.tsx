import { FC, useRef, useState, useCallback, useEffect } from 'react';
import { Button, Dialog, FlexBox, Input, Label } from '@ui5/webcomponents-react';
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

interface AddEditMemberDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (member: Member, isEdit: boolean) => void;
  existingMembers: Member[];
  memberToEdit?: Member;
}

const AddEditMemberDialog: FC<AddEditMemberDialogProps> = ({
  open,
  onClose,
  onSave,
  existingMembers,
  memberToEdit,
}) => {
  const { t } = useTranslation();
  const [accountType, setAccountType] = useState('user');
  const [namespace, setNamespace] = useState('');
  const [selectedRole, setSelectedRole] = useState(MemberRoles.viewer as string);
  const [email, setEmail] = useState('');
  const [emailState, setEmailState] = useState<ValueState>('None');
  const [emailMessage, setEmailMessage] = useState('');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const resetEmailValidation = useCallback(() => {
    setEmailState('None');
    setEmailMessage('');
  }, []);

  const validateEmail = useCallback((): boolean => {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailState('Negative');
      setEmailMessage(t('validationErrors.required'));
      return false;
    }

    const isEdit = !!memberToEdit;
    if (existingMembers.some((m) => m.name === trimmed && (!isEdit || m.name !== memberToEdit.name))) {
      setEmailState('Negative');
      setEmailMessage(t('validationErrors.userExists'));
      return false;
    }

    if (accountType === 'user' && !emailRegex.test(trimmed)) {
      setEmailState('Negative');
      setEmailMessage(t('validationErrors.invalidEmail'));
      return false;
    }

    return true;
  }, [email, accountType, existingMembers, memberToEdit, t]);

  const handleSave = useCallback(() => {
    if (!validateEmail()) {
      return;
    }

    const trimmedEmail = email.trim();

    const newMember: Member = {
      name: trimmedEmail,
      roles: [selectedRole],
      kind: accountType === 'service-account' ? 'ServiceAccount' : 'User',
      ...(accountType === 'service-account' && namespace && { namespace }),
    };

    onSave(newMember, !!memberToEdit);

    onClose();
    resetEmailValidation();
  }, [email, selectedRole, accountType, namespace, validateEmail, memberToEdit, onSave, onClose, resetEmailValidation]);

  const handleAccountTypeChange = useCallback((value: string) => {
    setAccountType(value);
    if (value === 'user') {
      setNamespace('');
    }
  }, []);

  const handleRoleChange = useCallback((role: string) => {
    setSelectedRole(role);
  }, []);

  const handleEmailInputChange = useCallback(
    (event: any) => {
      setEmail(event.target.value);
      resetEmailValidation();
    },
    [resetEmailValidation],
  );

  const handleNamespaceChange = useCallback((event: any) => {
    setNamespace(event.target.value);
  }, []);

  useEffect(() => {
    if (open) {
      if (memberToEdit) {
        setEmail(memberToEdit.name);
        setSelectedRole(memberToEdit.roles[0] || MemberRoles.viewer);
        const type = memberToEdit.kind === 'ServiceAccount' ? 'service-account' : 'user';
        setAccountType(type);
        setNamespace(memberToEdit.namespace || '');
      } else {
        setEmail('');
        setSelectedRole(MemberRoles.viewer);
        setAccountType('user');
        setNamespace('');
      }
      resetEmailValidation();
    }
  }, [open, memberToEdit, resetEmailValidation]);

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

  const dialogHeader = memberToEdit ? t('EditMembers.editHeader') : t('EditMembers.addHeader') || 'Add member';

  return (
    <Dialog open={open} headerText={dialogHeader}>
      <div className={styles.container}>
        <FlexBox alignItems="Stretch" direction={'Column'}>
          <FlexBox direction="Column" alignItems="Stretch" className={styles.wrapper}>
            <Label for="member-email-input">{t('common.name')}</Label>
            <Input
              id="member-email-input"
              type={accountType === 'user' ? 'Email' : 'Text'}
              value={email}
              valueState={emailState}
              valueStateMessage={<span>{emailMessage}</span>}
              data-testid="member-email-input"
              onChange={handleEmailInputChange}
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

          <Button className={styles.wrapper} onClick={onClose}>
            {t('buttons.cancel')}
          </Button>
          <Button
            className={styles.addButton}
            data-testid="add-member-button"
            design={'Emphasized'}
            icon={'sap-icon://add-employee'}
            onClick={handleSave}
          >
            {memberToEdit ? t('EditMembers.saveButton') : t('EditMembers.addButton')}
          </Button>
        </FlexBox>
      </div>
    </Dialog>
  );
};

export const EditMembers: FC<EditMembersProps> = ({
  members,
  onMemberChanged,
  isValidationError = false,
  requireAtLeastOneMember = true,
}) => {
  const { t } = useTranslation();

  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | undefined>(undefined);

  const handleRemoveMember = useCallback(
    (email: string) => {
      onMemberChanged(members.filter((m) => m.name !== email));
    },
    [members, onMemberChanged],
  );

  const handleOpenMemberFormDialog = useCallback(() => {
    setMemberToEdit(undefined);
    setIsMemberDialogOpen(true);
  }, []);

  const handleEditMember = useCallback((member: Member) => {
    setMemberToEdit(member);
    setIsMemberDialogOpen(true);
  }, []);

  const handleCloseMemberFormDialog = useCallback(() => {
    setIsMemberDialogOpen(false);
  }, []);

  const handleSaveMember = useCallback(
    (member: Member, isEdit: boolean) => {
      let updatedMembers: Member[];
      if (isEdit) {
        updatedMembers = members.map((m) => (m.name === memberToEdit?.name ? member : m));
      } else {
        updatedMembers = [...members, member];
      }
      onMemberChanged(updatedMembers);
      setIsMemberDialogOpen(false);
    },
    [members, onMemberChanged, memberToEdit],
  );

  return (
    <FlexBox direction="Column" gap={8}>
      <AddEditMemberDialog
        open={isMemberDialogOpen}
        existingMembers={members}
        memberToEdit={memberToEdit}
        onClose={handleCloseMemberFormDialog}
        onSave={handleSaveMember}
      />

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
        onEditMember={handleEditMember}
      />
    </FlexBox>
  );
};
