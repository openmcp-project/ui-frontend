import '@ui5/webcomponents-icons/dist/headset';
import '@ui5/webcomponents-icons/dist/world';
import { Label, Option, Select, SelectDomRef, Ui5CustomEvent } from '@ui5/webcomponents-react';
import { useEffect } from 'react';
import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { SUPPORT_LANDSCAPE_VALUES } from '../../lib/api/types/shared/keyNames.ts';
import { SupportInfoSectionHeader } from '../Shared/SupportInfoSection.tsx';
import { CreateDialogProps } from './CreateWorkspaceDialogContainer.tsx';
import styles from './SupportInfoForm.module.css';
import { TagListInput } from './TagListInput.tsx';

interface SupportInfoFormProps {
  register: UseFormRegister<CreateDialogProps>;
  watch: UseFormWatch<CreateDialogProps>;
  setValue: UseFormSetValue<CreateDialogProps>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.field}>
      <Label>{label}</Label>
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

  // Keep RHF aware of the three list-shaped fields even though the
  // TagListInput drives them via setValue rather than register spread.
  // The wire format stays a comma-separated string, so callers (yaml
  // preview, update mutation) don't change.
  useEffect(() => {
    register('supportServiceIds');
    register('supportSecurityContacts');
    register('supportOpsContacts');
  }, [register]);

  const handleLandscapeChange = (e: Ui5CustomEvent<SelectDomRef, { selectedOption: HTMLElement }>) => {
    const value = (e.detail.selectedOption as HTMLElement).dataset.value ?? '';
    setValue('supportLandscape', value);
  };

  return (
    <div className={styles.container}>
      <p className={styles.intro}>{t('SupportInfo.wizardIntro')}</p>
      <div className={styles.fields}>
        <Field label={t('SupportInfo.purposeLabel')}>
          <Select
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
        <Field label={t('SupportInfo.serviceIds')}>
          <TagListInput
            className={styles.input}
            data-testid="support-service-ids"
            placeholder={t('SupportInfo.serviceIdsPlaceholder')}
            value={supportServiceIds}
            onChange={(next) => setValue('supportServiceIds', next, { shouldDirty: true })}
          />
        </Field>

        <SupportInfoSectionHeader icon="headset" label={t('SupportInfo.contacts')} />
        <Field label={t('SupportInfo.securityContacts')}>
          <TagListInput
            className={styles.input}
            data-testid="support-security-contacts"
            placeholder={t('SupportInfo.contactsPlaceholder')}
            value={supportSecurityContacts}
            onChange={(next) => setValue('supportSecurityContacts', next, { shouldDirty: true })}
          />
        </Field>
        <Field label={t('SupportInfo.opsContacts')}>
          <TagListInput
            className={styles.input}
            data-testid="support-ops-contacts"
            placeholder={t('SupportInfo.contactsPlaceholder')}
            value={supportOpsContacts}
            onChange={(next) => setValue('supportOpsContacts', next, { shouldDirty: true })}
          />
        </Field>
      </div>
    </div>
  );
}
