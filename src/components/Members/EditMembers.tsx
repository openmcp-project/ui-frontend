import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Dialog, FlexBox, Form, Input, Label } from '@ui5/webcomponents-react';
import { MemberTable } from './MemberTable.tsx';
import { Member, MemberRoles, memberRolesOptions } from '../../lib/api/types/shared/members';
import { useTranslation } from 'react-i18next';
import styles from './Members.module.css';
import { RadioButtonsSelect, RadioButtonsSelectOption } from '../Ui/RadioButtonsSelect/RadioButtonsSelect.tsx';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

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

type MemberFormData = {
  accountType: 'user' | 'service-account';
  name: string;
  role: string;
  namespace?: string;
};

const AddEditMemberDialog: FC<AddEditMemberDialogProps> = ({
  open,
  onClose,
  onSave,
  existingMembers,
  memberToEdit,
}) => {
  const { t } = useTranslation();
  const isEdit = !!memberToEdit;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const memberFormSchema = useMemo(
    () =>
      z
        .object({
          accountType: z.enum(['user', 'service-account']),
          name: z.string(),
          role: z.string(),
          namespace: z.string().optional(),
        })
        .superRefine((data, ctx) => {
          const trimmed = data.name.trim();
          if (!trimmed) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['name'],
              message: t('validationErrors.required'),
            });
          }
          if (existingMembers.some((m) => m.name === trimmed && (!memberToEdit || trimmed !== memberToEdit.name))) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['name'],
              message: t('validationErrors.userExists'),
            });
          }
          if (data.accountType === 'user' && !emailRegex.test(trimmed)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['name'],
              message: t('validationErrors.invalidEmail'),
            });
          }
        }),
    [t, existingMembers, memberToEdit],
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberFormSchema),
    mode: 'onChange',
    defaultValues: {
      accountType: 'user',
      name: '',
      role: MemberRoles.viewer,
      namespace: '',
    },
  });

  const accountType = watch('accountType');
  const role = watch('role');

  useEffect(() => {
    if (accountType === 'user') {
      setValue('namespace', '');
    }
  }, [accountType, setValue]);

  useEffect(() => {
    if (open) {
      if (memberToEdit) {
        reset({
          name: memberToEdit.name,
          role: memberToEdit.roles[0] || MemberRoles.viewer,
          accountType: memberToEdit.kind === 'User' ? 'user' : 'service-account',
          namespace: memberToEdit?.namespace || '',
        });
      } else {
        reset({
          accountType: 'user',
          name: '',
          role: MemberRoles.viewer,
          namespace: '',
        });
      }
    }
  }, [open, memberToEdit, reset]);

  const onFormSubmit = (data: MemberFormData) => {
    const trimmedName = data.name.trim();

    const newMember: Member = {
      name: trimmedName,
      roles: [data.role],
      kind: data.accountType === 'user' ? 'User' : 'ServiceAccount',
      ...(data.accountType === 'service-account' && data.namespace && { namespace: data.namespace }),
    };

    onSave(newMember, isEdit);
    onClose();
  };

  const renderServiceAccountFields = () => {
    if (accountType !== 'service-account') {
      return null;
    }

    return (
      <FlexBox direction="Column">
        <Label for="namespace-input">Namespace</Label>
        <Input type="Text" {...register('namespace')} data-testid="namespace-input" id="namespace-input" />
      </FlexBox>
    );
  };

  const dialogHeader = memberToEdit ? t('EditMembers.editHeader') : t('EditMembers.addHeader') || 'Add member';

  return (
    <Dialog open={open} headerText={dialogHeader}>
      <Form>
        <div className={styles.container}>
          <FlexBox alignItems="Stretch" direction={'Column'}>
            <FlexBox direction="Column" alignItems="Stretch" className={styles.wrapper}>
              <Label for="member-email-input">{t('common.name')}</Label>
              <Input
                id="member-email-input"
                type={accountType === 'user' ? 'Email' : 'Text'}
                {...register('name')}
                valueState={errors.name ? 'Negative' : 'None'}
                valueStateMessage={<span>{errors.name?.message}</span>}
                data-testid="member-email-input"
              />
            </FlexBox>

            <div className={styles.wrapper}>
              <RadioButtonsSelect
                selectedValue={role}
                options={memberRolesOptions}
                handleOnClick={(value) => setValue('role', value, { shouldValidate: true })}
                label={t('MemberTable.columnRoleHeader')}
              />
            </div>

            <FlexBox alignItems={'Baseline'} direction={'Column'} className={styles.wrapper}>
              <FlexBox alignItems={'Baseline'} justifyContent={'SpaceBetween'}>
                <RadioButtonsSelect
                  label={'Account type:'}
                  selectedValue={accountType}
                  options={ACCOUNT_TYPES}
                  handleOnClick={(value) =>
                    setValue('accountType', value as 'user' | 'service-account', { shouldValidate: true })
                  }
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
              onClick={() => {
                handleSubmit(onFormSubmit)();
              }}
            >
              {memberToEdit ? t('EditMembers.saveButton') : t('EditMembers.addButton')}
            </Button>
          </FlexBox>
        </div>
      </Form>
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
