import '@ui5/webcomponents-icons/dist/cause';
import '@ui5/webcomponents-icons/dist/headset';
import '@ui5/webcomponents-icons/dist/world';
import {
  Button,
  ButtonDomRef,
  Label,
  Menu,
  MenuDomRef,
  MenuItem,
  MessageStrip,
  Option,
  Select,
  SelectDomRef,
  Ui5CustomEvent,
} from '@ui5/webcomponents-react';
import type { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';
import { useRef, useState } from 'react';
import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { SUPPORT_LANDSCAPE_VALUES } from '../../lib/api/types/shared/keyNames.ts';
import { useProjectMembers as _useProjectMembers } from '../../spaces/onboarding/hooks/useProjectMembers.ts';
import { useGetWorkspace as _useGetWorkspace } from '../../spaces/onboarding/hooks/useGetWorkspace.ts';
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
  useProjectMembers?: typeof _useProjectMembers;
  useGetWorkspace?: typeof _useGetWorkspace;
}

type ReuseSource = 'Project' | 'Workspace';

interface SupportInfoValues {
  supportLandscape: string;
  supportServiceIds: string;
  supportSecurityContacts: string;
  supportOpsContacts: string;
}

function ReuseSupportInfoButton({
  projectName,
  workspaceName,
  workspaceNamespace,
  setValue,
  useProjectMembers = _useProjectMembers,
  useGetWorkspace = _useGetWorkspace,
}: {
  projectName?: string;
  workspaceName?: string;
  workspaceNamespace?: string;
  setValue: UseFormSetValue<CreateDialogProps>;
  useProjectMembers?: typeof _useProjectMembers;
  useGetWorkspace?: typeof _useGetWorkspace;
}) {
  const { t } = useTranslation();
  const menuRef = useRef<MenuDomRef>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const project = useProjectMembers(projectName);
  const workspace = useGetWorkspace(workspaceName, workspaceNamespace);

  const valuesBySource: Record<ReuseSource, SupportInfoValues> = {
    Project: {
      supportLandscape: project.supportLandscape ?? '',
      supportServiceIds: project.supportServiceIds ?? '',
      supportSecurityContacts: project.supportSecurityContacts ?? '',
      supportOpsContacts: project.supportOpsContacts ?? '',
    },
    Workspace: {
      supportLandscape: workspace.workspaceData?.supportLandscape ?? '',
      supportServiceIds: workspace.workspaceData?.supportServiceIds ?? '',
      supportSecurityContacts: workspace.workspaceData?.supportSecurityContacts ?? '',
      supportOpsContacts: workspace.workspaceData?.supportOpsContacts ?? '',
    },
  };

  const handleOpenerClick = (e: Ui5CustomEvent<ButtonDomRef, ButtonClickEventDetail>) => {
    if (menuRef.current && e.currentTarget) {
      menuRef.current.opener = e.currentTarget as HTMLElement;
      setMenuOpen((prev) => !prev);
    }
  };

  const hasData = (source: ReuseSource) => Object.values(valuesBySource[source]).some((v) => v.trim() !== '');
  const canReuseProject = !!projectName && hasData('Project');
  const canReuseWorkspace = !!workspaceName && !!workspaceNamespace && hasData('Workspace');

  const handleReuse = (source: ReuseSource) => {
    (Object.entries(valuesBySource[source]) as [keyof SupportInfoValues, string][]).forEach(([field, value]) =>
      setValue(field, value, { shouldDirty: true, shouldValidate: true }),
    );
  };

  const isLoading = project.isLoading || workspace.isLoading;
  const nothingToReuse = !isLoading && !canReuseProject && !canReuseWorkspace;

  return (
    <>
      <Button
        className={styles.reuseButton}
        data-testid="reuse-support-info-button"
        disabled={isLoading || nothingToReuse}
        icon="cause"
        tooltip={nothingToReuse ? t('SupportInfo.reuseNothingAvailable') : undefined}
        onClick={handleOpenerClick}
      >
        {t('SupportInfo.reuseButton')}
      </Button>
      <Menu
        ref={menuRef}
        open={menuOpen}
        onItemClick={(event) => {
          const source = (event.detail.item as HTMLElement).dataset.source as ReuseSource;
          handleReuse(source);
          setMenuOpen(false);
        }}
      >
        {canReuseProject && (
          <MenuItem
            data-source="Project"
            data-testid="reuse-support-info-from-project"
            text={projectName}
            additionalText={t('Entities.Project')}
          />
        )}
        {canReuseWorkspace && (
          <MenuItem
            data-source="Workspace"
            data-testid="reuse-support-info-from-workspace"
            text={workspaceName}
            additionalText={t('Entities.Workspace')}
          />
        )}
      </Menu>
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

  const showReuseButton = copyFromProjectName || (copyFromWorkspaceName && copyFromWorkspaceNamespace);

  return (
    <div className={styles.container}>
      <MessageStrip className={styles.intro} design="Information" hideCloseButton>
        {t('SupportInfo.wizardIntro')}
      </MessageStrip>
      {showReuseButton && (
        <div className={styles.reuseRow}>
          <ReuseSupportInfoButton
            projectName={copyFromProjectName}
            workspaceName={copyFromWorkspaceName}
            workspaceNamespace={copyFromWorkspaceNamespace}
            setValue={setValue}
            useProjectMembers={useProjectMembers}
            useGetWorkspace={useGetWorkspace}
          />
        </div>
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
