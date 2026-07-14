import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Dialog, FlexBox, Input, Label, Link, MessageStrip, Option, Select } from '@ui5/webcomponents-react';
import { Activity, FC, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';
import { DEFAULT_IDP_NAME, Member, MemberRoles, memberRolesOptions } from '../../lib/api/types/shared/members.ts';
import { useLink } from '../../lib/shared/useLink.ts';
import { RadioButtonsSelect, RadioButtonsSelectOption } from '../Ui/RadioButtonsSelect/RadioButtonsSelect.tsx';
import { ACCOUNT_TYPES, AccountType } from './EditMembers.tsx';
import styles from './Members.module.css';

interface AddEditMemberDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (member: Member, isEdit: boolean) => void;
  existingMembers: Member[];
  memberToEdit?: Member;
  accountTypeOptions?: RadioButtonsSelectOption[];
  roleOptions?: RadioButtonsSelectOption[];
  defaultRole?: string;
  /** Show the IdP picker (v2 control planes). The list is Default + these names. */
  showIdp?: boolean;
  idpOptions?: string[];
}

type MemberFormData = {
  accountType: AccountType;
  name: string;
  role: string;
  namespace?: string;
  idp: string;
};

export const AddEditMemberDialog: FC<AddEditMemberDialogProps> = ({
  open,
  onClose,
  onSave,
  existingMembers,
  memberToEdit,
  accountTypeOptions,
  roleOptions,
  defaultRole,
  showIdp = false,
  idpOptions,
}) => {
  const effectiveAccountTypeOptions = accountTypeOptions ?? ACCOUNT_TYPES;
  const showIdpPicker = showIdp;
  const allowedAccountTypes = useMemo(
    () => effectiveAccountTypeOptions.map((option) => option.value) as AccountType[],
    [effectiveAccountTypeOptions],
  );
  const usesUserGroupAccountTypes = useMemo(
    () => allowedAccountTypes.includes('Group') && !allowedAccountTypes.includes('ServiceAccount'),
    [allowedAccountTypes],
  );
  const effectiveRoleOptions = roleOptions ?? memberRolesOptions;
  const effectiveDefaultRole = defaultRole ?? MemberRoles.view;
  const { t } = useTranslation();
  const isEdit = !!memberToEdit;
  const { serviceAccoutsGuide } = useLink();
  const memberFormSchema = useMemo(
    () =>
      z
        .object({
          accountType: z.enum(['User', 'Group', 'ServiceAccount']),
          name: z.string(),
          role: z.string(),
          namespace: z.string().optional(),
          idp: z.string(),
        })
        .superRefine((data, ctx) => {
          if (!allowedAccountTypes.includes(data.accountType)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['accountType'],
              message: t('validationErrors.required'),
            });
          }

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
    [t, existingMembers, memberToEdit, allowedAccountTypes],
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
      accountType: allowedAccountTypes[0] ?? 'User',
      name: '',
      role: effectiveDefaultRole,
      namespace: '',
      idp: DEFAULT_IDP_NAME,
    },
  });

  const accountType = useWatch({ control, name: 'accountType' });
  const role = useWatch({ control, name: 'role' });
  const idp = useWatch({ control, name: 'idp' });

  useEffect(() => {
    if (open) {
      if (memberToEdit) {
        const memberKind: AccountType =
          memberToEdit.kind === 'ServiceAccount' ? 'ServiceAccount' : memberToEdit.kind === 'Group' ? 'Group' : 'User';
        const accountType = allowedAccountTypes.includes(memberKind) ? memberKind : (allowedAccountTypes[0] ?? 'User');
        reset({
          name: memberToEdit.name,
          role: memberToEdit.roles?.[0] || effectiveDefaultRole,
          accountType,
          namespace: accountType === 'ServiceAccount' ? (memberToEdit?.namespace ?? '') : '',
          idp: memberToEdit.idp || DEFAULT_IDP_NAME,
        });
      } else {
        reset({
          accountType: allowedAccountTypes[0] ?? 'User',
          name: '',
          role: effectiveDefaultRole,
          namespace: '',
          idp: DEFAULT_IDP_NAME,
        });
      }
    }
  }, [open, memberToEdit, reset, effectiveDefaultRole, allowedAccountTypes]);

  const onFormSubmit = (data: MemberFormData) => {
    const trimmedName = data.name.trim();

    const newMember: Member = {
      name: trimmedName,
      roles: [data.role],
      kind: data.accountType,
      ...(data.accountType === 'ServiceAccount' && data.namespace && { namespace: data.namespace }),
      ...(showIdpPicker && data.idp && data.idp !== DEFAULT_IDP_NAME && { idp: data.idp }),
    };

    onSave(newMember, isEdit);
    onClose();
  };

  const dialogHeader = memberToEdit
    ? t(usesUserGroupAccountTypes ? 'EditMembers.editHeaderUserGroup' : 'EditMembers.editHeader')
    : t(usesUserGroupAccountTypes ? 'EditMembers.addHeaderUserGroup' : 'EditMembers.addHeader');

  return (
    <Dialog open={open} headerText={dialogHeader} onClose={onClose}>
      <div className={styles.container}>
        <FlexBox alignItems={'Baseline'} direction={'Column'} className={styles.wrapper}>
          <FlexBox alignItems={'Baseline'} justifyContent={'SpaceBetween'}>
            <RadioButtonsSelect
              label={'Account type:'}
              selectedValue={accountType}
              options={effectiveAccountTypeOptions}
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
          {effectiveRoleOptions.length > 1 && (
            <div className={styles.wrapper}>
              <RadioButtonsSelect
                selectedValue={role}
                options={effectiveRoleOptions}
                handleOnClick={(value) => setValue('role', value, { shouldValidate: true })}
                label={t('MemberTable.columnRoleHeader')}
              />
            </div>
          )}

          {showIdpPicker && (
            <FlexBox direction="Column" alignItems="Stretch" className={styles.wrapper}>
              <Label for="member-idp-select">{t('MemberTable.columnIdpHeader')}</Label>
              <Select
                id="member-idp-select"
                data-testid="member-idp-select"
                value={idp}
                onChange={(e) => {
                  const value = (e.detail.selectedOption as HTMLElement).dataset.value ?? DEFAULT_IDP_NAME;
                  setValue('idp', value, { shouldValidate: true });
                }}
              >
                <Option data-value={DEFAULT_IDP_NAME} selected={idp === DEFAULT_IDP_NAME}>
                  {t('MemberTable.defaultIdp')}
                </Option>
                {idpOptions?.map((name) => (
                  <Option key={name} data-value={name} selected={idp === name}>
                    {name}
                  </Option>
                ))}
              </Select>
            </FlexBox>
          )}

          <div className={styles.placeholder}>
            <Activity mode={accountType === 'ServiceAccount' ? 'visible' : 'hidden'}>
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
            </Activity>
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
            {memberToEdit
              ? t('EditMembers.saveButton')
              : t(usesUserGroupAccountTypes ? 'EditMembers.addButtonUserGroup' : 'EditMembers.addButton')}
          </Button>
          <Button className={styles.wrapper} onClick={onClose}>
            {t('buttons.cancel')}
          </Button>
        </FlexBox>
      </div>
    </Dialog>
  );
};
