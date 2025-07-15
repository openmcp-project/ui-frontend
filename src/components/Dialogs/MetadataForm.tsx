import { FieldErrors, UseFormGetValues, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { CreateDialogProps } from './CreateWorkspaceDialogContainer.tsx';
import { useTranslation } from 'react-i18next';
import { Form, FormGroup, Input, Label, Option, Select, SelectDomRef, Ui5CustomEvent } from '@ui5/webcomponents-react';
import styles from './CreateProjectWorkspaceDialog.module.css';
import React from 'react';

export interface MetadataFormProps {
  register: UseFormRegister<CreateDialogProps>;
  errors: FieldErrors<CreateDialogProps>;
  setValue: UseFormSetValue<CreateDialogProps>;
  sideFormContent?: React.ReactNode;
  requireChargingTarget?: boolean;
  getValues: UseFormGetValues<CreateDialogProps>;
}

interface SelectOption {
  label: string;
  value: string;
}

export function MetadataForm({
  getValues,
  register,
  errors,
  setValue,
  sideFormContent,
  requireChargingTarget = false,
}: MetadataFormProps) {
  const { t } = useTranslation();
  const handleChargingTargetTypeChange = (event: Ui5CustomEvent<SelectDomRef, { selectedOption: HTMLElement }>) => {
    const selectedOption = event.detail.selectedOption as HTMLElement;
    setValue('chargingTargetType', selectedOption.dataset.value);
  };
  const chargingTypes: SelectOption[] = [
    ...(!requireChargingTarget ? [{ label: t('common.notSelected'), value: '' }] : []),
    { label: t('common.btp'), value: 'btp' },
  ];
  return (
    <Form>
      <FormGroup headerText={t('CreateProjectWorkspaceDialog.metadataHeader')} columnSpan={12}>
        <Label for="name" required>
          {t('CreateProjectWorkspaceDialog.nameLabel')}
        </Label>
        <Input
          className={styles.input}
          id="name"
          {...register('name')}
          valueState={errors.name ? 'Negative' : 'None'}
          valueStateMessage={<span>{errors.name?.message}</span>}
          required
        />
        <Label for={'displayName'}>{t('CreateProjectWorkspaceDialog.displayNameLabel')}</Label>
        <Input id="displayName" {...register('displayName')} className={styles.input} />
        <Label for={'chargingTargetType'}>{t('CreateProjectWorkspaceDialog.chargingTargetTypeLabel')}</Label>
        <Select id={'chargingTargetType'} className={styles.input} onChange={handleChargingTargetTypeChange}>
          {chargingTypes.map((option) => (
            <Option key={option.value} data-value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>

        <Label for={'chargingTarget'} required={!!getValues?.('chargingTargetType')}>
          {t('CreateProjectWorkspaceDialog.chargingTargetLabel')}
        </Label>
        <Input
          id="chargingTarget"
          {...register('chargingTarget')}
          className={styles.input}
          valueState={errors.chargingTarget ? 'Negative' : 'None'}
          valueStateMessage={<span>{errors.chargingTarget?.message}</span>}
          disabled={!getValues?.('chargingTargetType')}
        />
      </FormGroup>

      {sideFormContent ? sideFormContent : null}
    </Form>
  );
}
