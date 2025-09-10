import { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
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
  watch: UseFormWatch<CreateDialogProps>;
  disableChargingFields?: boolean;
  namePrefix?: string;
  displayNamePrefix?: string;
  nameSuffix?: string;
  displayNameSuffix?: string;
}

interface SelectOption {
  label: string;
  value: string;
}

export function MetadataForm({
  watch,
  register,
  errors,
  setValue,
  sideFormContent,
  requireChargingTarget = false,
  disableChargingFields = false,
  namePrefix = '',
  displayNamePrefix = '',
  nameSuffix: propNameSuffix = '',
  displayNameSuffix: propDisplayNameSuffix = '',
}: MetadataFormProps) {
  const { t } = useTranslation();

  const handleChargingTargetTypeChange = (event: Ui5CustomEvent<SelectDomRef, { selectedOption: HTMLElement }>) => {
    const selectedOption = event.detail.selectedOption as HTMLElement;
    const value = selectedOption.dataset.value ?? '';
    setValue('chargingTargetType', value, { shouldValidate: true, shouldDirty: true });
    if (value === '') {
      setValue('chargingTarget', '', { shouldValidate: true, shouldDirty: true });
    }
  };

  const chargingTypes: SelectOption[] = [
    ...(!requireChargingTarget ? [{ label: t('common.notSelected'), value: '' }] : []),
    { label: t('common.btp'), value: 'btp' },
  ];

  const currentChargingTargetType = (watch?.('chargingTargetType') ?? '').toLowerCase();

  const currentName = watch?.('name') ?? '';
  const currentDisplayName = watch?.('displayName') ?? '';

  // Resolve and normalize affixes once (trim + fallback to '')
  const resolvedNamePrefix = (namePrefix || '').trim();
  const resolvedDisplayNamePrefix = (displayNamePrefix || '').trim();
  const resolvedNameSuffix = (propNameSuffix || '').trim();
  const resolvedDisplayNameSuffix = (propDisplayNameSuffix || '').trim();

  const computeCore = (full: string, prefix: string, suffix: string) => {
    let v = full ?? '';
    if (prefix && v.startsWith(prefix)) v = v.slice(prefix.length);
    if (suffix && v.endsWith(suffix)) v = v.slice(0, v.length - suffix.length);
    return v;
  };

  const nameCore = computeCore(currentName, resolvedNamePrefix, resolvedNameSuffix);
  const displayNameCore = computeCore(currentDisplayName, resolvedDisplayNamePrefix, resolvedDisplayNameSuffix);

  const onNameCoreInput = (e: any) => {
    const middle =
      (e?.target && typeof e.target.value === 'string' ? e.target.value : undefined) ??
      (e?.detail && typeof e.detail.value === 'string' ? e.detail.value : '') ??
      '';
    setValue('name', `${resolvedNamePrefix}${middle}${resolvedNameSuffix}`, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const onDisplayNameCoreInput = (e: any) => {
    const middle =
      (e?.target && typeof e.target.value === 'string' ? e.target.value : undefined) ??
      (e?.detail && typeof e.detail.value === 'string' ? e.detail.value : '') ??
      '';
    setValue('displayName', `${resolvedDisplayNamePrefix}${middle}${resolvedDisplayNameSuffix}`, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const affixWidth = (val?: string) => (val && val.length ? `${val.length + 1}ch` : 'auto');

  return (
    <Form>
      <FormGroup headerText={t('CreateProjectWorkspaceDialog.metadataHeader')} columnSpan={12}>
        <Label for="name" required>
          {t('CreateProjectWorkspaceDialog.nameLabel')}
        </Label>

        {resolvedNamePrefix || resolvedNameSuffix ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {resolvedNamePrefix ? (
              <Input
                className={styles.input}
                id="namePrefix"
                value={resolvedNamePrefix}
                disabled
                style={{ width: affixWidth(resolvedNamePrefix) }}
              />
            ) : null}
            {/* hidden input to keep RHF registration and validation for 'name' */}
            <input type="hidden" {...register('name')} value={currentName} readOnly />
            <Input
              className={styles.input}
              id="name"
              value={nameCore}
              valueState={errors.name ? 'Negative' : 'None'}
              valueStateMessage={<span>{errors.name?.message}</span>}
              required
              onInput={onNameCoreInput}
            />
            {resolvedNameSuffix ? (
              <Input
                className={styles.input}
                id="nameSuffix"
                value={resolvedNameSuffix}
                disabled
                style={{ width: affixWidth(resolvedNameSuffix) }}
              />
            ) : null}
          </div>
        ) : (
          <Input
            className={styles.input}
            id="name"
            {...register('name')}
            valueState={errors.name ? 'Negative' : 'None'}
            valueStateMessage={<span>{errors.name?.message}</span>}
            required
          />
        )}

        <Label for={'displayName'}>{t('CreateProjectWorkspaceDialog.displayNameLabel')}</Label>

        {resolvedDisplayNamePrefix || resolvedDisplayNameSuffix ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {resolvedDisplayNamePrefix ? (
              <Input
                className={styles.input}
                id="displayNamePrefix"
                value={resolvedDisplayNamePrefix}
                disabled
                style={{ width: affixWidth(resolvedDisplayNamePrefix) }}
              />
            ) : null}
            <input type="hidden" {...register('displayName')} value={currentDisplayName} readOnly />
            <Input className={styles.input} id="displayName" value={displayNameCore} onInput={onDisplayNameCoreInput} />
            {resolvedDisplayNameSuffix ? (
              <Input
                className={styles.input}
                id="displayNameSuffix"
                value={resolvedDisplayNameSuffix}
                disabled
                style={{ width: affixWidth(resolvedDisplayNameSuffix) }}
              />
            ) : null}
          </div>
        ) : (
          <Input id="displayName" {...register('displayName')} className={styles.input} />
        )}

        <div>
          <Label for={'chargingTargetType'}>{t('CreateProjectWorkspaceDialog.chargingTargetTypeLabel')}</Label>
        </div>
        <Select
          id={'chargingTargetType'}
          className={styles.input}
          disabled={disableChargingFields}
          onChange={handleChargingTargetTypeChange}
        >
          {chargingTypes.map((option) => (
            <Option key={option.value} data-value={option.value} selected={currentChargingTargetType === option.value}>
              {option.label}
            </Option>
          ))}
        </Select>

        <Label for={'chargingTarget'} required={!!watch?.('chargingTargetType')}>
          {t('CreateProjectWorkspaceDialog.chargingTargetLabel')}
        </Label>
        <Input
          id="chargingTarget"
          {...register('chargingTarget')}
          className={styles.input}
          valueState={errors.chargingTarget ? 'Negative' : 'None'}
          valueStateMessage={<span>{errors.chargingTarget?.message}</span>}
          disabled={disableChargingFields || !watch?.('chargingTargetType')}
        />
      </FormGroup>

      {sideFormContent ? sideFormContent : null}
    </Form>
  );
}
