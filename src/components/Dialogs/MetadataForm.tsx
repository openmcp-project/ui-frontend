import { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { CreateDialogProps } from './CreateWorkspaceDialogContainer.tsx';
import { useTranslation } from 'react-i18next';
import {
  Form,
  FormGroup,
  Input,
  Label,
  Option,
  Select,
  SelectDomRef,
  Ui5CustomEvent,
  InputDomRef,
} from '@ui5/webcomponents-react';

import styles from './MetadataForm.module.css';
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
  isEditMode?: boolean;
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
  isEditMode = false,
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
  };

  const chargingTypes: SelectOption[] = [
    ...(!requireChargingTarget ? [{ label: t('common.notSelected'), value: '' }] : []),
    { label: t('common.btp'), value: 'btp' },
  ];

  const currentChargingTargetType = (watch?.('chargingTargetType') ?? '').toLowerCase();

  const currentName = watch?.('name') ?? '';
  const currentDisplayName = watch?.('displayName') ?? '';

  const resolvedNamePrefix = (namePrefix || '').trim();
  const resolvedDisplayNamePrefix = (displayNamePrefix || '').trim();
  const resolvedNameSuffix = (propNameSuffix || '').trim();
  const resolvedDisplayNameSuffix = (propDisplayNameSuffix || '').trim();

  const computeCore = (full: string, prefix: string, suffix: string) => {
    let name = full ?? '';
    if (prefix && name.startsWith(prefix)) name = name.slice(prefix.length);
    if (suffix && name.endsWith(suffix)) name = name.slice(0, name.length - suffix.length);
    return name;
  };

  const nameCore = computeCore(currentName, resolvedNamePrefix, resolvedNameSuffix);
  const displayNameCore = computeCore(currentDisplayName, resolvedDisplayNamePrefix, resolvedDisplayNameSuffix);

  const onNameCoreInput = (e: Ui5CustomEvent<InputDomRef, { value: string }>) => {
    const middle = typeof e.detail?.value === 'string' ? e.detail.value : (e.target.value ?? '');
    setValue('name', `${resolvedNamePrefix}${middle}${resolvedNameSuffix}`, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const onDisplayNameCoreInput = (e: Ui5CustomEvent<InputDomRef, { value: string }>) => {
    const middle = typeof e.detail?.value === 'string' ? e.detail.value : (e.target.value ?? '');
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
          <div className={styles.affixRow}>
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
              disabled={isEditMode}
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
            disabled={isEditMode}
          />
        )}

        <Label for={'displayName'}>{t('CreateProjectWorkspaceDialog.displayNameLabel')}</Label>

        {resolvedDisplayNamePrefix || resolvedDisplayNameSuffix ? (
          <div className={styles.affixRow}>
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
          value={watch?.('chargingTargetType') ?? ''}
          id={'chargingTargetType'}
          className={styles.input}
          disabled={disableChargingFields}
          onChange={handleChargingTargetTypeChange}
        >
          {chargingTypes.map((option) => (
            <Option
              key={option.value}
              value={option.value}
              data-value={option.value}
              selected={currentChargingTargetType === option.value}
            >
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
