import '@ui5/webcomponents-icons/dist/copy';
import '@ui5/webcomponents-icons/dist/headset';
import '@ui5/webcomponents-icons/dist/world';
import {
  Button,
  Label,
  MessageBox,
  MessageBoxType,
  Option,
  Select,
  SelectDomRef,
  Ui5CustomEvent,
} from '@ui5/webcomponents-react';
import { useState } from 'react';
import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { SUPPORT_LANDSCAPE_VALUES } from '../../lib/api/types/shared/keyNames.ts';
import { useProjectMembers as _useProjectMembers } from '../../spaces/onboarding/hooks/useProjectMembers.ts';
import { useGetWorkspace as _useGetWorkspace } from '../../spaces/onboarding/hooks/useGetWorkspace.ts';
import { Infobox } from '../Ui/Infobox/Infobox.tsx';
import { Tooltip } from '../Ui/Tooltip/Tooltip.tsx';
import { SupportInfoSectionHeader } from '../Shared/SupportInfoSection.tsx';
import { CreateDialogProps } from './CreateWorkspaceDialogContainer.tsx';
import styles from './SupportInfoForm.module.css';
import { TagListInput } from './TagListInput.tsx';

interface SupportInfoFormProps {
  register: UseFormRegister<CreateDialogProps>;
  watch: UseFormWatch<CreateDialogProps>;
  setValue: UseFormSetValue<CreateDialogProps>;
  copyFromProjectName?: string;
  copyFromWorkspaceName?: string;
  copyFromWorkspaceNamespace?: string;
  introText?: string;
  useProjectMembers?: typeof _useProjectMembers;
  useGetWorkspace?: typeof _useGetWorkspace;
}

function CopySupportInfoFromProjectButton({
  projectName,
  setValue,
  useProjectMembers = _useProjectMembers,
}: {
  projectName: string;
  setValue: UseFormSetValue<CreateDialogProps>;
  useProjectMembers?: typeof _useProjectMembers;
}) {
  const { t } = useTranslation();
  // We only need the parent project's support annotations here; useProjectMembers
  // is the existing query that already exposes them (its members payload is unused).
  const { supportLandscape, supportServiceIds, supportSecurityContacts, supportOpsContacts, isLoading } =
    useProjectMembers(projectName);
  const [noDataOpen, setNoDataOpen] = useState(false);

  const handleCopy = () => {
    const values = {
      supportLandscape: supportLandscape ?? '',
      supportServiceIds: supportServiceIds ?? '',
      supportSecurityContacts: supportSecurityContacts ?? '',
      supportOpsContacts: supportOpsContacts ?? '',
    } as const;

    if (!Object.values(values).some((v) => v.trim() !== '')) {
      setNoDataOpen(true);
      return;
    }

    (Object.entries(values) as [keyof typeof values, string][]).forEach(([field, value]) =>
      setValue(field, value, { shouldDirty: true, shouldValidate: true }),
    );
  };

  return (
    <>
      <Button
        data-testid="copy-support-info-from-project"
        design="Transparent"
        disabled={isLoading}
        icon="copy"
        onClick={handleCopy}
      >
        {t('SupportInfo.copyFromProject')}
      </Button>
      <MessageBox
        open={noDataOpen}
        titleText={t('SupportInfo.copyFromProject')}
        type={MessageBoxType.Information}
        onClose={() => setNoDataOpen(false)}
      >
        {t('SupportInfo.copyFromProjectNoData')}
      </MessageBox>
    </>
  );
}

function CopySupportInfoFromWorkspaceButton({
  workspaceName,
  namespace,
  setValue,
  useGetWorkspace = _useGetWorkspace,
}: {
  workspaceName: string;
  namespace: string;
  setValue: UseFormSetValue<CreateDialogProps>;
  useGetWorkspace?: typeof _useGetWorkspace;
}) {
  const { t } = useTranslation();
  const { workspaceData, isLoading } = useGetWorkspace(workspaceName, namespace);
  const [noDataOpen, setNoDataOpen] = useState(false);

  const handleCopy = () => {
    const values = {
      supportLandscape: workspaceData?.supportLandscape ?? '',
      supportServiceIds: workspaceData?.supportServiceIds ?? '',
      supportSecurityContacts: workspaceData?.supportSecurityContacts ?? '',
      supportOpsContacts: workspaceData?.supportOpsContacts ?? '',
    } as const;

    if (!Object.values(values).some((v) => v.trim() !== '')) {
      setNoDataOpen(true);
      return;
    }

    (Object.entries(values) as [keyof typeof values, string][]).forEach(([field, value]) =>
      setValue(field, value, { shouldDirty: true, shouldValidate: true }),
    );
  };

  return (
    <>
      <Button
        data-testid="copy-support-info-from-workspace"
        design="Transparent"
        disabled={isLoading}
        icon="copy"
        onClick={handleCopy}
      >
        {t('SupportInfo.copyFromWorkspace')}
      </Button>
      <MessageBox
        open={noDataOpen}
        titleText={t('SupportInfo.copyFromWorkspace')}
        type={MessageBoxType.Information}
        onClose={() => setNoDataOpen(false)}
      >
        {t('SupportInfo.copyFromWorkspaceNoData')}
      </MessageBox>
    </>
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
  copyFromProjectName,
  copyFromWorkspaceName,
  copyFromWorkspaceNamespace,
  introText,
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

  const showCopyRow = copyFromProjectName || (copyFromWorkspaceName && copyFromWorkspaceNamespace);

  return (
    <div className={styles.container}>
      {showCopyRow && (
        <div className={styles.copyRow}>
          {copyFromProjectName && (
            <CopySupportInfoFromProjectButton
              projectName={copyFromProjectName}
              setValue={setValue}
              useProjectMembers={useProjectMembers}
            />
          )}
          {copyFromWorkspaceName && copyFromWorkspaceNamespace && (
            <CopySupportInfoFromWorkspaceButton
              workspaceName={copyFromWorkspaceName}
              namespace={copyFromWorkspaceNamespace}
              setValue={setValue}
              useGetWorkspace={useGetWorkspace}
            />
          )}
        </div>
      )}
      <Infobox variant={'success'} size="sm">
        {introText ?? t('SupportInfo.wizardIntro')}
      </Infobox>
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
