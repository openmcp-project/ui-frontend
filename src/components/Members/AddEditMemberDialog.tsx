import { zodResolver } from '@hookform/resolvers/zod';
import { Bar, Button, Dialog, FlexBox, Input, Label, Link, MessageStrip } from '@ui5/webcomponents-react';
import { Activity, FC, lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';
import { DEFAULT_CLUSTER_ROLE, isPresetClusterRole, uniqueRoles } from '../../lib/api/types/shared/clusterRoles.ts';
import { Member, MemberRoles, MemberRolesDetailed, memberRolesOptions } from '../../lib/api/types/shared/members.ts';
import { useLink } from '../../lib/shared/useLink.ts';
import { useToast } from '../../context/ToastContext.tsx';
import { RadioButtonsSelect, RadioButtonsSelectOption } from '../Ui/RadioButtonsSelect/RadioButtonsSelect.tsx';
import type { ClusterRoleDialogMode } from './ClusterRoleDialog.tsx';
import { CustomRolesState, MemberAccessSelect } from './MemberAccessSelect.tsx';
import { ACCOUNT_TYPES, AccountType } from './EditMembers.tsx';
import { ChoiceOption, RoleBadge } from './MemberBadges.tsx';
import styles from './Members.module.css';

// Lazy so Monaco (the YAML editor) only loads when a user actually opens the role dialog, not with
// every member dialog / wizard mount.
const ClusterRoleDialog = lazy(() => import('./ClusterRoleDialog.tsx').then((m) => ({ default: m.ClusterRoleDialog })));

interface AddEditMemberDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (member: Member, isEdit: boolean) => void;
  existingMembers: Member[];
  memberToEdit?: Member;
  accountTypeOptions?: RadioButtonsSelectOption[];
  // ControlPlane (v2): members are bound to one or more Kubernetes ClusterRoles instead of a single
  // project/workspace role.
  clusterRoles?: boolean;
  availableCustomRoles?: string[];
  customRolesState?: CustomRolesState;
  platformDocsUrl?: string;
  // Link to this control plane's roles in the embedded Headlamp view (when a session exists).
  rolesViewUrl?: string;
  // Names of ClusterRoles carrying an aggregationRule (controller-managed, not editable).
  aggregatedRoles?: string[];
  // Role management (view/create/upload) is only possible with a control-plane session: the lookup
  // state is 'ready' or 'error'. Otherwise the buttons stay hidden and names stay free text.
  canManageRoles?: boolean;
  // Refresh the ClusterRoles lookup after a role was created or edited.
  onRoleApplied?: () => void;
  testIdPrefix?: string;
}

type MemberFormData = {
  accountType: AccountType;
  name: string;
  role: string;
  // clusterRoles mode only
  roles: string[];
  namespace?: string;
};

export const AddEditMemberDialog: FC<AddEditMemberDialogProps> = ({
  open,
  onClose,
  onSave,
  existingMembers,
  memberToEdit,
  accountTypeOptions,
  clusterRoles = false,
  availableCustomRoles,
  customRolesState,
  platformDocsUrl,
  rolesViewUrl,
  aggregatedRoles = [],
  canManageRoles = false,
  onRoleApplied,
  testIdPrefix,
}) => {
  const effectiveAccountTypeOptions = accountTypeOptions ?? ACCOUNT_TYPES;
  const allowedAccountTypes = useMemo(
    () => effectiveAccountTypeOptions.map((option) => option.value) as AccountType[],
    [effectiveAccountTypeOptions],
  );
  const usesUserGroupAccountTypes = useMemo(
    () => allowedAccountTypes.includes('Group') && !allowedAccountTypes.includes('ServiceAccount'),
    [allowedAccountTypes],
  );
  const effectiveRoleOptions = useMemo((): RadioButtonsSelectOption[] => {
    if (clusterRoles) return [];
    const base = memberRolesOptions;
    if (!memberToEdit) return base;
    const editedRole = memberToEdit.roles?.[0];
    if (!editedRole || base.some((o) => o.value === editedRole)) return base;
    // The member has a role that is no longer offered in the picker (e.g. 'viewer'
    // is currently disabled). Append it as a read-only-looking option so the form
    // pre-fills correctly instead of showing a blank selection.
    const existing = MemberRolesDetailed[editedRole];
    return [...base, { value: editedRole, label: existing?.displayValue ?? editedRole, disabled: true }];
  }, [clusterRoles, memberToEdit]);
  const effectiveDefaultRole = MemberRoles.view;
  const { t } = useTranslation();
  const toast = useToast();
  const isEdit = !!memberToEdit;
  const { serviceAccoutsGuide } = useLink();
  const withTestId = (testId: string) => (testIdPrefix ? `${testIdPrefix}-${testId}` : testId);
  const memberFormSchema = useMemo(
    () =>
      z
        .object({
          accountType: z.enum(['User', 'Group', 'ServiceAccount']),
          name: z.string(),
          role: z.string(),
          roles: z.array(z.string()),
          namespace: z.string().optional(),
        })
        .superRefine((data, ctx) => {
          if (clusterRoles && data.roles.length === 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['roles'],
              message: t('MemberAccess.atLeastOneRole'),
            });
          }

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
    [t, existingMembers, memberToEdit, allowedAccountTypes, clusterRoles],
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
      roles: [DEFAULT_CLUSTER_ROLE],
      namespace: '',
    },
  });

  const accountType = useWatch({ control, name: 'accountType' });
  const role = useWatch({ control, name: 'role' });
  const roles = useWatch({ control, name: 'roles' });

  // ClusterRoleDialog (view/create/edit a role without leaving the member dialog).
  const [roleDialog, setRoleDialog] = useState<{ mode: ClusterRoleDialogMode; name: string; yaml?: string } | null>(
    null,
  );
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const addRoleToSelection = (next: string[]) => setValue('roles', next, { shouldValidate: true, shouldDirty: true });

  const handleCreateRole = (name?: string) => setRoleDialog({ mode: 'create', name: name ?? '' });
  const handleViewRole = (name: string) => setRoleDialog({ mode: 'view', name });

  const handleUploadRole = () => uploadInputRef.current?.click();
  const handleUploadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    file
      .text()
      .then((content) => setRoleDialog({ mode: 'create', name: '', yaml: content }))
      .catch(() => toast.show(t('ClusterRoleDialog.uploadReadError')));
  };

  const handleRoleApplied = (appliedName: string) => {
    // The created/edited role is live immediately; select it for the member and refresh the lookup.
    addRoleToSelection(uniqueRoles([...roles, appliedName]));
    onRoleApplied?.();
  };

  useEffect(() => {
    if (open) {
      if (memberToEdit) {
        const memberKind: AccountType =
          memberToEdit.kind === 'ServiceAccount' ? 'ServiceAccount' : memberToEdit.kind === 'Group' ? 'Group' : 'User';
        const accountType = allowedAccountTypes.includes(memberKind) ? memberKind : (allowedAccountTypes[0] ?? 'User');
        reset({
          name: memberToEdit.name,
          role: memberToEdit.roles?.[0] || effectiveDefaultRole,
          roles: memberToEdit.roles?.length ? uniqueRoles(memberToEdit.roles) : [DEFAULT_CLUSTER_ROLE],
          accountType,
          namespace: accountType === 'ServiceAccount' ? (memberToEdit?.namespace ?? '') : '',
        });
      } else {
        reset({
          accountType: allowedAccountTypes[0] ?? 'User',
          name: '',
          role: effectiveDefaultRole,
          roles: [DEFAULT_CLUSTER_ROLE],
          namespace: '',
        });
      }
    }
  }, [open, memberToEdit, reset, effectiveDefaultRole, allowedAccountTypes]);

  const onFormSubmit = (data: MemberFormData) => {
    const trimmedName = data.name.trim();

    const newMember: Member = {
      name: trimmedName,
      roles: clusterRoles ? uniqueRoles(data.roles) : [data.role],
      kind: data.accountType,
      ...(data.accountType === 'ServiceAccount' && data.namespace && { namespace: data.namespace }),
    };

    onSave(newMember, isEdit);
    onClose();
  };

  const dialogHeader = memberToEdit
    ? t(usesUserGroupAccountTypes ? 'EditMembers.editHeaderUserGroup' : 'EditMembers.editHeader')
    : t(usesUserGroupAccountTypes ? 'EditMembers.addHeaderUserGroup' : 'EditMembers.addHeader');

  const footer = (
    <Bar
      design="Footer"
      endContent={
        <>
          <Button design="Transparent" onClick={onClose}>
            {t('buttons.cancel')}
          </Button>
          <Button
            data-testid={withTestId('add-member-submit-button')}
            design="Emphasized"
            icon={'sap-icon://add-employee'}
            onClick={() => handleSubmit(onFormSubmit)()}
          >
            {memberToEdit ? t('EditMembers.saveButton') : t(`EditMembers.addButton${accountType}`)}
          </Button>
        </>
      }
    />
  );

  return (
    <Dialog footer={footer} open={open} headerText={dialogHeader} onClose={onClose}>
      <div className={styles.container}>
        <FlexBox alignItems={'Baseline'} direction={'Column'} className={styles.wrapper}>
          <FlexBox alignItems={'Baseline'} justifyContent={'SpaceBetween'}>
            <div data-testid={withTestId('account-type')}>
              <RadioButtonsSelect
                label={t('MemberAccess.accountType.label')}
                options={effectiveAccountTypeOptions}
                selectedValue={accountType}
                handleOnClick={(value) => setValue('accountType', value as AccountType, { shouldValidate: true })}
              />
            </div>
          </FlexBox>
        </FlexBox>
        <FlexBox direction="Column" alignItems="Stretch" className={styles.wrapper}>
          {/* id kept static: an existing cy test selects #member-email-input directly. */}
          <Label for="member-email-input">{t('common.name')}</Label>
          <Input
            className={styles.input}
            id="member-email-input"
            type={accountType === 'User' ? 'Email' : 'Text'}
            {...register('name')}
            valueState={errors.name ? 'Negative' : 'None'}
            valueStateMessage={<span>{errors.name?.message}</span>}
            data-testid={withTestId('member-email-input')}
          />
        </FlexBox>
        <FlexBox alignItems="Stretch" direction={'Column'}>
          {clusterRoles && open && (
            <div className={styles.wrapper}>
              <MemberAccessSelect
                roles={roles}
                availableCustomRoles={availableCustomRoles}
                customRolesState={customRolesState}
                defaultCustomPanelCollapsed={!(memberToEdit?.roles ?? []).some((r) => !isPresetClusterRole(r))}
                platformDocsUrl={platformDocsUrl}
                rolesViewUrl={rolesViewUrl}
                errorMessage={errors.roles?.message}
                testIdPrefix={testIdPrefix}
                onChange={(next) => setValue('roles', next, { shouldValidate: true, shouldDirty: true })}
                onCreateRole={canManageRoles ? handleCreateRole : undefined}
                onViewRole={canManageRoles ? handleViewRole : undefined}
                onUploadRole={canManageRoles ? handleUploadRole : undefined}
              />
            </div>
          )}
          {!clusterRoles && effectiveRoleOptions.length > 1 && (
            <div className={styles.wrapper}>
              <FlexBox direction="Column">
                <Label>{t('MemberTable.columnRoleHeader')}</Label>
                <FlexBox className={styles.accountTypes} role="radiogroup">
                  {effectiveRoleOptions.map(({ value, label, disabled }) => (
                    <ChoiceOption
                      key={value}
                      type="radio"
                      name={withTestId('member-role')}
                      checked={role === value}
                      disabled={disabled}
                      badge={<RoleBadge role={value} />}
                      accessibleName={label}
                      testId={withTestId(`member-role-${value}`)}
                      onToggle={() => setValue('role', value, { shouldValidate: true })}
                    />
                  ))}
                </FlexBox>
              </FlexBox>
            </div>
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
                    data-testid={withTestId('namespace-input')}
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
        </FlexBox>
      </div>
      {clusterRoles && (
        <input
          ref={uploadInputRef}
          type="file"
          accept=".yaml,.yml"
          style={{ display: 'none' }}
          data-testid={withTestId('upload-role-input')}
          onChange={handleUploadFile}
        />
      )}
      {roleDialog && (
        <Suspense fallback={null}>
          <ClusterRoleDialog
            mode={roleDialog.mode}
            roleName={roleDialog.name}
            initialYaml={roleDialog.yaml}
            aggregatedRoles={aggregatedRoles}
            testIdPrefix={testIdPrefix}
            onClose={() => setRoleDialog(null)}
            onApplied={handleRoleApplied}
          />
        </Suspense>
      )}
    </Dialog>
  );
};
