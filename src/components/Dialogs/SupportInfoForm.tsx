import '@ui5/webcomponents-icons/dist/headset';
import '@ui5/webcomponents-icons/dist/world';
import { Input, Label, Option, Select, SelectDomRef, Ui5CustomEvent } from '@ui5/webcomponents-react';
import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { SUPPORT_LANDSCAPE_VALUES } from '../../lib/api/types/shared/keyNames.ts';
import { SupportInfoSectionHeader } from '../Shared/SupportInfoSection.tsx';
import { CreateDialogProps } from './CreateWorkspaceDialogContainer.tsx';
import styles from './SupportInfoForm.module.css';

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

  const handleLandscapeChange = (e: Ui5CustomEvent<SelectDomRef, { selectedOption: HTMLElement }>) => {
    const value = (e.detail.selectedOption as HTMLElement).dataset.value ?? '';
    setValue('supportLandscape', value);
  };

  return (
    <div className={styles.container}>
      <p className={styles.intro}>{t('SupportInfo.wizardIntro')}</p>
      <div className={styles.fields}>
        <Field label={t('SupportInfo.purposeLabel')}>
          <Select value={supportLandscape} className={styles.input} onChange={handleLandscapeChange}>
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
          <Input {...register('supportServiceIds')} placeholder="ID-12345,ID-67890..." className={styles.input} />
        </Field>

        <SupportInfoSectionHeader icon="headset" label={t('SupportInfo.contacts')} />
        <Field label={t('SupportInfo.securityContacts')}>
          <Input
            {...register('supportSecurityContacts')}
            placeholder="mail:team@example.com"
            className={styles.input}
          />
        </Field>
        <Field label={t('SupportInfo.opsContacts')}>
          <Input {...register('supportOpsContacts')} placeholder="mail:team@example.com" className={styles.input} />
        </Field>
      </div>
    </div>
  );
}
