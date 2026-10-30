import '@ui5/webcomponents-icons/dist/headset';
import '@ui5/webcomponents-icons/dist/world';
import { Label, MessageStrip, Option, Select, SelectDomRef, Ui5CustomEvent } from '@ui5/webcomponents-react';
import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { SUPPORT_LANDSCAPE_VALUES } from '../../lib/api/types/shared/keyNames.ts';
import { purposeLabel, SupportInfo } from '../../lib/supportInfo.ts';
import { useInheritedSupportInfo } from '../../spaces/onboarding/hooks/useInheritedSupportInfo.ts';
import { useProjectMembers as _useProjectMembers } from '../../spaces/onboarding/hooks/useProjectMembers.ts';
import { useGetWorkspace as _useGetWorkspace } from '../../spaces/onboarding/hooks/useGetWorkspace.ts';
import { InheritedFromText } from '../Shared/InheritedFromText.tsx';
import { Tooltip } from '../Ui/Tooltip/Tooltip.tsx';
import { SupportInfoSectionHeader } from '../Shared/SupportInfoSection.tsx';
import { CreateDialogProps } from './CreateWorkspaceDialogContainer.tsx';
import styles from './SupportInfoForm.module.css';
import { TagListInput } from './TagListInput.tsx';

interface SupportInfoFormProps {
  register: UseFormRegister<CreateDialogProps>;
  watch: UseFormWatch<CreateDialogProps>;
  setValue: UseFormSetValue<CreateDialogProps>;
  /** Bare project name of the parent project (workspaces and control planes). */
  parentProjectName?: string;
  /** Parent workspace name (control planes only). */
  parentWorkspaceName?: string;
  useProjectMembers?: typeof _useProjectMembers;
  useGetWorkspace?: typeof _useGetWorkspace;
}

// The hint lists what the empty fields fall back to; only non-empty values are worth naming.
function inheritedSummary(t: ReturnType<typeof useTranslation>['t'], info: SupportInfo): string {
  const parts = [
    info.supportLandscape && purposeLabel(t, info.supportLandscape),
    info.supportServiceIds,
    info.supportSecurityContacts,
    info.supportOpsContacts,
  ].filter((v): v is string => !!v);
  return parts.join(' · ');
}

function InheritedSupportInfoHint({
  projectName,
  workspaceName,
  ownIsEmpty,
  useProjectMembers,
  useGetWorkspace,
}: {
  projectName: string;
  workspaceName?: string;
  ownIsEmpty: boolean;
  useProjectMembers?: typeof _useProjectMembers;
  useGetWorkspace?: typeof _useGetWorkspace;
}) {
  const { t } = useTranslation();
  // Resolve against the parents only (own = empty) to learn what an empty form falls back to.
  const parentDefaults = useInheritedSupportInfo(
    {},
    { projectName, workspaceName, useProjectMembers, useGetWorkspace },
  );
  const { inheritedFrom } = parentDefaults;
  if (!inheritedFrom) return null;
  const summary = inheritedSummary(t, parentDefaults.info);

  return (
    <MessageStrip
      className={styles.intro}
      data-testid="support-info-form-inherited"
      data-active={ownIsEmpty ? 'true' : 'false'}
      design={ownIsEmpty ? 'Information' : 'Critical'}
      hideCloseButton
    >
      <InheritedFromText source={inheritedFrom} />
      {summary && <span>: {summary}</span>}
      <div className={styles.inheritedHint}>
        {ownIsEmpty ? t('SupportInfo.inheritedFormHint') : t('SupportInfo.inheritedOverriddenHint')}
      </div>
    </MessageStrip>
  );
}

function Field({
  label,
  inputId,
  tooltip,
  children,
}: {
  label: string;
  inputId?: string;
  tooltip?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldLabel}>
        <Label for={inputId}>{label}</Label>
        {tooltip && <Tooltip text={tooltip} />}
      </div>
      {children}
    </div>
  );
}

export function SupportInfoForm({
  register,
  watch,
  setValue,
  parentProjectName,
  parentWorkspaceName,
  useProjectMembers,
  useGetWorkspace,
}: SupportInfoFormProps) {
  const { t } = useTranslation();
  const supportLandscape = watch('supportLandscape') ?? '';
  const supportServiceIds = watch('supportServiceIds') ?? '';
  const supportSecurityContacts = watch('supportSecurityContacts') ?? '';
  const supportOpsContacts = watch('supportOpsContacts') ?? '';

  const handleLandscapeChange = (e: Ui5CustomEvent<SelectDomRef, { selectedOption: HTMLElement }>) => {
    const value = (e.detail.selectedOption as HTMLElement).dataset.value ?? '';
    setValue('supportLandscape', value, { shouldDirty: true, shouldValidate: true });
  };

  const ownIsEmpty = ![supportLandscape, supportServiceIds, supportSecurityContacts, supportOpsContacts].some(
    (v) => v.trim() !== '',
  );

  return (
    <div className={styles.container}>
      <MessageStrip className={styles.intro} design="Information" hideCloseButton>
        {t('SupportInfo.wizardIntro')}
      </MessageStrip>
      {parentProjectName && (
        <InheritedSupportInfoHint
          projectName={parentProjectName}
          workspaceName={parentWorkspaceName}
          ownIsEmpty={ownIsEmpty}
          useProjectMembers={useProjectMembers}
          useGetWorkspace={useGetWorkspace}
        />
      )}
      <div className={styles.fields}>
        <Field label={t('SupportInfo.purposeLabel')} inputId="support-landscape">
          <Select
            id="support-landscape"
            data-testid="support-landscape"
            value={supportLandscape}
            className={styles.input}
            onChange={handleLandscapeChange}
          >
            <Option value="" data-value="">
              {t('common.notSelected')}
            </Option>
            {SUPPORT_LANDSCAPE_VALUES.map((v) => (
              <Option key={v} value={v} data-value={v}>
                {t(`SupportInfo.landscape.${v}`)}
              </Option>
            ))}
          </Select>
        </Field>

        <SupportInfoSectionHeader icon="world" label={t('SupportInfo.contextSection')} />
        <Field
          label={t('SupportInfo.serviceIds')}
          inputId="support-service-ids"
          tooltip={t('SupportInfo.serviceIdsTooltip')}
        >
          <input type="hidden" {...register('supportServiceIds')} value={supportServiceIds} readOnly />
          <TagListInput
            className={styles.input}
            id="support-service-ids"
            data-testid="support-service-ids"
            placeholder={t('SupportInfo.serviceIdsPlaceholder')}
            value={supportServiceIds}
            onChange={(next) => setValue('supportServiceIds', next, { shouldDirty: true, shouldValidate: true })}
          />
        </Field>

        <SupportInfoSectionHeader icon="headset" label={t('SupportInfo.contacts')} />
        <Field
          label={t('SupportInfo.securityContacts')}
          inputId="support-security-contacts"
          tooltip={t('SupportInfo.securityContactsTooltip')}
        >
          <input type="hidden" {...register('supportSecurityContacts')} value={supportSecurityContacts} readOnly />
          <TagListInput
            className={styles.input}
            id="support-security-contacts"
            data-testid="support-security-contacts"
            placeholder={t('SupportInfo.securityContactsPlaceholder')}
            value={supportSecurityContacts}
            onChange={(next) => setValue('supportSecurityContacts', next, { shouldDirty: true, shouldValidate: true })}
          />
        </Field>
        <Field
          label={t('SupportInfo.opsContacts')}
          inputId="support-ops-contacts"
          tooltip={t('SupportInfo.opsContactsTooltip')}
        >
          <input type="hidden" {...register('supportOpsContacts')} value={supportOpsContacts} readOnly />
          <TagListInput
            className={styles.input}
            id="support-ops-contacts"
            data-testid="support-ops-contacts"
            placeholder={t('SupportInfo.opsContactsPlaceholder')}
            value={supportOpsContacts}
            onChange={(next) => setValue('supportOpsContacts', next, { shouldDirty: true, shouldValidate: true })}
          />
        </Field>
      </div>
    </div>
  );
}
