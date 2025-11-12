import { FC, useEffect, useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Member, MemberRoles, memberRolesOptions } from '../../lib/api/types/shared/members.ts';
import { Button, Dialog, FlexBox, Input, Label, Link, MessageStrip } from '@ui5/webcomponents-react';
import styles from './Members.module.css';
import { RadioButtonsSelect } from '../Ui/RadioButtonsSelect/RadioButtonsSelect.tsx';
import { ACCOUNT_TYPES, AccountType } from './EditMembers.tsx';
import { useLink } from '../../lib/shared/useLink.ts';
import { clsx } from 'clsx';

interface AddEditMemberDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (member: Member, isEdit: boolean) => void;
  existingMembers: Member[];
  memberToEdit?: Member;
}

type MemberFormData = {
  accountType: AccountType;
  name: string;
  role: string;
  namespace?: string;
};

export const AddEditMemberDialog: FC<AddEditMemberDialogProps> = ({
  open,
  onClose,
  onSave,
  existingMembers,
  memberToEdit,
}) => {
  const { t } = useTranslation();
  const isEdit = !!memberToEdit;
  const { serviceAccoutsGuide } = useLink();
  const memberFormSchema = useMemo(
    () =>
      z
        .object({
          accountType: z.enum(['User', 'ServiceAccount']),
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
        }),
    [t, existingMembers, memberToEdit],
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberFormSchema),
    mode: 'onChange',
    defaultValues: {
      accountType: 'User',
      name: '',
      role: MemberRoles.view,
      namespace: '',
    },
  });

  const accountType = useWatch({ control, name: 'accountType' });
  const role = useWatch({ control, name: 'role' });

  useEffect(() => {
    if (open) {
      if (memberToEdit) {
        reset({
          name: memberToEdit.name,
          role: memberToEdit.roles?.[0] || MemberRoles.view,
          accountType: memberToEdit.kind === 'User' ? 'User' : 'ServiceAccount',
          namespace: memberToEdit?.namespace || '',
        });
      } else {
        reset({
          accountType: 'User',
          name: '',
          role: MemberRoles.view,
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
      kind: data.accountType,
      ...(data.accountType === 'ServiceAccount' && data.namespace && { namespace: data.namespace }),
    };

    onSave(newMember, isEdit);
    onClose();
  };

  const dialogHeader = memberToEdit ? t('EditMembers.editHeader') : t('EditMembers.addHeader') || 'Add member';

  return (
    <Dialog open={open} headerText={dialogHeader} onClose={onClose}>
      <div className={styles.container}>
        <FlexBox alignItems={'Baseline'} direction={'Column'} className={styles.wrapper}>
          <FlexBox alignItems={'Baseline'} justifyContent={'SpaceBetween'}>
            <RadioButtonsSelect
              label={'Account type:'}
              selectedValue={accountType}
              options={ACCOUNT_TYPES}
              handleOnClick={(value) => setValue('accountType', value as AccountType, { shouldValidate: true })}
            />
          </FlexBox>
        </FlexBox>
        <FlexBox direction="Column" alignItems="Stretch" className={styles.wrapper}>
          <Label for="member-email-input">{t('common.name')}</Label>
          <Input
            className={styles.input}
            id="member-email-input"
            type={accountType === 'User' ? 'Email' : 'Text'}
            {...register('name')}
            valueState={errors.name ? 'Negative' : 'None'}
            valueStateMessage={<span>{errors.name?.message}</span>}
            data-testid="member-email-input"
          />
        </FlexBox>
        <FlexBox alignItems="Stretch" direction={'Column'}>
          <div className={styles.wrapper}>
            <RadioButtonsSelect
              selectedValue={role}
              options={memberRolesOptions}
              handleOnClick={(value) => setValue('role', value, { shouldValidate: true })}
              label={t('MemberTable.columnRoleHeader')}
            />
          </div>

          <div className={styles.placeholder}>
            <div
              className={clsx(
                styles.serviceAccountContainer,
                accountType === 'ServiceAccount'
                  ? styles.serviceAccountContainerVisible
                  : styles.serviceAccountContainerHidden,
              )}
            >
              <div>
                <FlexBox direction="Column">
                  <Label for="namespace-input">{t('common.namespace')}</Label>
                  <Input
                    type="Text"
                    {...register('namespace')}
                    className={styles.input}
                    data-testid="namespace-input"
                    id="namespace-input"
                  />
                </FlexBox>
              </div>

              <Label>
                <Trans
                  i18nKey="EditMembers.defaultNamespaceInfo"
                  components={{ span: <span className="mono-font" /> }}
                />
              </Label>
              <div>
                <MessageStrip className={styles.info} design="Information" hideCloseButton={true}>
                  <Trans
                    i18nKey="EditMembers.serviceAccoutsGuide"
                    components={{
                      link1: <Link href={serviceAccoutsGuide} target="_blank" />,
                    }}
                  />
                </MessageStrip>
              </div>
            </div>
          </div>

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
          <Button className={styles.wrapper} onClick={onClose}>
            {t('buttons.cancel')}
          </Button>
        </FlexBox>
      </div>
    </Dialog>
  );
};
