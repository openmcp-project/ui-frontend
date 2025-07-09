import React from 'react';
import {
  FieldErrors,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
} from 'react-hook-form';
import { CreateDialogProps } from './CreateWorkspaceDialogContainer.tsx';
import { useTranslation } from 'react-i18next';
import {
  FlexBox,
  Form,
  FormGroup,
  Input,
  Label,
  Option,
  Select,
  SelectDomRef,
  Ui5CustomEvent,
} from '@ui5/webcomponents-react';
import styles from './CreateProjectWorkspaceDialog.module.css';

export interface MetadataFormProps {
  register: UseFormRegister<CreateDialogProps>;
  errors: FieldErrors<CreateDialogProps>;
  setValue: UseFormSetValue<CreateDialogProps>;
  sideFormContent?: React.ReactNode;
  requireChargingTarget?: boolean;
  getValues?: UseFormGetValues<CreateDialogProps>;
}

interface SelectOption {
  label: string;
  value: string;
}

const getInputWidth = (val?: string, extra: number = 1) =>
  val?.length ? `${val.length + extra}ch` : 'inherit';

const PrefixSuffixInput: React.FC<{
  id: string;
  value?: string;
  registerName: keyof CreateDialogProps;
  register: UseFormRegister<CreateDialogProps>;
  extraWidth?: number;
  disabled?: boolean;
}> = ({ id, value, registerName, register, extraWidth = 1 }) =>
  value ? (
    <div>
      <Input
        className={styles.inputSmall}
        style={{ width: getInputWidth(value, extraWidth) }}
        id={id}
        {...register(registerName)}
        value={value}
        readonly
      />
    </div>
  ) : null;

export function MetadataForm({
  register,
  errors,
  setValue,
  getValues,
  sideFormContent,
  requireChargingTarget = false,
}: MetadataFormProps) {
  const { t } = useTranslation();

  const handleChargingTargetTypeChange = (
    event: Ui5CustomEvent<SelectDomRef, { selectedOption: HTMLElement }>,
  ) => {
    const selectedOption = event.detail.selectedOption as HTMLElement;
    setValue('chargingTargetType', selectedOption.dataset.value);
  };

  const chargingTypes: SelectOption[] = [
    ...(!requireChargingTarget
      ? [{ label: t('common.notSelected'), value: '' }]
      : []),
    { label: t('common.btp'), value: 'btp' },
  ];

  // Helper to get error message for name field
  const nameError = errors.name?.message as string | undefined;

  return (
    <Form>
      <FormGroup
        headerText={t('CreateProjectWorkspaceDialog.metadataHeader')}
        columnSpan={12}
      >
        {/* Name */}
        <Label for="name" required>
          {t('CreateProjectWorkspaceDialog.nameLabel')}
        </Label>
        <FlexBox className={styles.autoWidth} justifyContent={'SpaceBetween'}>
          <PrefixSuffixInput
            id="namePrefix"
            value={getValues?.('namePrefix')}
            registerName="namePrefix"
            register={register}
            extraWidth={2}
            disabled
          />
          <div className={styles.fullWidth}>
            <Input
              className={styles.fullWidth}
              id="name"
              {...register('name')}
              valueState={errors.name ? 'Negative' : 'None'}
              valueStateMessage={
                nameError ? <span>{nameError}</span> : undefined
              }
              required
            />
          </div>
          <PrefixSuffixInput
            id="nameSuffix"
            value={getValues?.('nameSuffix')}
            registerName="nameSuffix"
            register={register}
            extraWidth={2}
            disabled
          />
        </FlexBox>

        {/* Display Name */}
        <Label for="displayName">
          {t('CreateProjectWorkspaceDialog.displayNameLabel')}
        </Label>
        <FlexBox className={styles.autoWidth} justifyContent={'SpaceBetween'}>
          <PrefixSuffixInput
            id="displayNamePrefix"
            value={getValues?.('displayNamePrefix')}
            registerName="displayNamePrefix"
            register={register}
            extraWidth={2}
            disabled
          />
          <div className={styles.fullWidth}>
            <Input
              className={styles.fullWidth}
              id="displayName"
              {...register('displayName')}
            />
          </div>
          <PrefixSuffixInput
            id="displayNameSuffix"
            value={getValues?.('displayNameSuffix')}
            registerName="displayNameSuffix"
            register={register}
            extraWidth={2}
            disabled
          />
        </FlexBox>

        {/* Charging Target Type */}
        <Label for="chargingTargetType" required={requireChargingTarget}>
          {t('CreateProjectWorkspaceDialog.chargingTargetTypeLabel')}
        </Label>
        <Select
          id="chargingTargetType"
          className={styles.input}
          onChange={handleChargingTargetTypeChange}
        >
          {chargingTypes.map((option) => (
            <Option key={option.value} data-value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>

        {/* Charging Target */}
        <Label for="chargingTarget" required={requireChargingTarget}>
          {t('CreateProjectWorkspaceDialog.chargingTargetLabel')}
        </Label>
        <Input
          id="chargingTarget"
          {...register('chargingTarget')}
          className={styles.input}
        />
      </FormGroup>

      {sideFormContent ?? null}
    </Form>
  );
}
