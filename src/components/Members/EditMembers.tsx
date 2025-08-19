import { FC, useCallback, useState } from 'react';
import { Button, FlexBox } from '@ui5/webcomponents-react';
import { MemberTable } from './MemberTable.tsx';
import { Member } from '../../lib/api/types/shared/members';
import { useTranslation } from 'react-i18next';
import styles from './Members.module.css';
import { RadioButtonsSelectOption } from '../Ui/RadioButtonsSelect/RadioButtonsSelect.tsx';
import { AddEditMemberDialog } from './AddEditMemberDialog.tsx';

export interface EditMembersProps {
  members: Member[];
  onMemberChanged: (members: Member[]) => void;
  isValidationError?: boolean;
  requireAtLeastOneMember?: boolean;
}

export const ACCOUNT_TYPES: RadioButtonsSelectOption[] = [
  { value: 'User', label: 'User Account', icon: 'employee' },
  { value: 'ServiceAccount', label: 'Service Account', icon: 'machine' },
];

export type AccountType = 'User' | 'ServiceAccount';

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
        updatedMembers = members.map((m) =>
          m.name === memberToEdit?.name
            ? { ...member, namespace: member.kind === 'ServiceAccount' ? member.namespace?.trim() : undefined }
            : m,
        );
      } else {
        updatedMembers = [
          ...members,
          { ...member, namespace: member.kind === 'ServiceAccount' ? member.namespace?.trim() : undefined },
        ];
      }
      onMemberChanged(updatedMembers);
      setIsMemberDialogOpen(false);
    },
    [members, onMemberChanged, memberToEdit],
  );

  return (
    <FlexBox direction="Column" gap={8}>
      <Button
        className={styles.addButton}
        data-testid="add-member-button"
        design="Emphasized"
        icon={'sap-icon://add-employee'}
        onClick={handleOpenMemberFormDialog}
      >
        {t('EditMembers.addButton')}
      </Button>
      <AddEditMemberDialog
        open={isMemberDialogOpen}
        existingMembers={members}
        memberToEdit={memberToEdit}
        onClose={handleCloseMemberFormDialog}
        onSave={handleSaveMember}
      />

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
