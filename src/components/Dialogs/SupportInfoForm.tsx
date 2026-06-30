import { Input, Label, Option, Select, SelectDomRef, Ui5CustomEvent } from '@ui5/webcomponents-react';
import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { SUPPORT_LANDSCAPE_VALUES } from '../../lib/api/types/shared/keyNames.ts';
import { CreateDialogProps } from './CreateWorkspaceDialogContainer.tsx';

interface SupportInfoFormProps {
  register: UseFormRegister<CreateDialogProps>;
  watch: UseFormWatch<CreateDialogProps>;
  setValue: UseFormSetValue<CreateDialogProps>;
}

export function SupportInfoForm({ register, watch, setValue }: SupportInfoFormProps) {
  const { t } = useTranslation();
  const supportLandscape = watch('supportLandscape') ?? '';

  const handleLandscapeChange = (e: Ui5CustomEvent<SelectDomRef, { selectedOption: HTMLElement }>) => {
    const value = (e.detail.selectedOption as HTMLElement).dataset.value ?? '';
    setValue('supportLandscape', value);
  };

  return (
    <div style={{ width: '100%', maxWidth: '40rem', textAlign: 'left' }}>
      <p style={{ margin: '0 0 1rem', color: 'var(--sapContent_LabelColor)', fontSize: '0.875rem' }}>
        {t('SupportInfo.wizardIntro')}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <Label>{t('SupportInfo.purposeLabel')}</Label>
          <Select value={supportLandscape} style={{ width: '100%' }} onChange={handleLandscapeChange}>
            <Option value="" data-value="">
              {t('common.notSelected')}
            </Option>
            {SUPPORT_LANDSCAPE_VALUES.map((v) => (
              <Option key={v} value={v} data-value={v}>
                {t(`SupportInfo.landscape.${v}`)}
              </Option>
            ))}
          </Select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <Label>{t('SupportInfo.managedRegions')}</Label>
          <Input {...register('supportManagedRegions')} placeholder="eu10,us10,ap11" style={{ width: '100%' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <Label>{t('SupportInfo.serviceIds')}</Label>
          <Input {...register('supportServiceIds')} placeholder="ID-12345,ID-67890" style={{ width: '100%' }} />
        </div>
        <div style={{ marginTop: '0.5rem', fontWeight: 600, color: 'var(--sapContent_LabelColor)' }}>
          {t('SupportInfo.contacts')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <Label>{t('SupportInfo.securityContacts')}</Label>
          <Input
            {...register('supportSecurityContacts')}
            placeholder="mail:team@example.com"
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <Label>{t('SupportInfo.opsContacts')}</Label>
          <Input {...register('supportOpsContacts')} placeholder="mail:team@example.com" style={{ width: '100%' }} />
        </div>
      </div>
    </div>
  );
}
