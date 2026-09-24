import '@ui5/webcomponents-icons/dist/headset';
import '@ui5/webcomponents-icons/dist/world';
import { Label, Option, Select, SelectDomRef, Ui5CustomEvent } from '@ui5/webcomponents-react';
import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { SUPPORT_LANDSCAPE_VALUES } from '../../lib/api/types/shared/keyNames.ts';
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

export function SupportInfoForm({ register, watch, setValue }: SupportInfoFormProps) {
  const { t } = useTranslation();
  const supportLandscape = watch('supportLandscape') ?? '';
  const supportServiceIds = watch('supportServiceIds') ?? '';
  const supportSecurityContacts = watch('supportSecurityContacts') ?? '';
  const supportOpsContacts = watch('supportOpsContacts') ?? '';

  const handleLandscapeChange = (e: Ui5CustomEvent<SelectDomRef, { selectedOption: HTMLElement }>) => {
    const value = (e.detail.selectedOption as HTMLElement).dataset.value ?? '';
    setValue('supportLandscape', value, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <div className={styles.container}>
      <Infobox variant={'success'} size="sm">
        {t('SupportInfo.wizardIntro')}
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
            onChange={(next) => setValue('supportServiceIds', next, { shouldDirty: true })}
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
            onChange={(next) => setValue('supportSecurityContacts', next, { shouldDirty: true })}
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
            onChange={(next) => setValue('supportOpsContacts', next, { shouldDirty: true })}
          />
        </Field>
      </div>
    </div>
  );
}
