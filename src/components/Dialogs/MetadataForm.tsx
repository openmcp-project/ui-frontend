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
import React from 'react';

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
  return (
    <Form>
      <FormGroup
        headerText={t('CreateProjectWorkspaceDialog.metadataHeader')}
        columnSpan={12}
      >
        <FlexBox>
          {getValues?.('namePrefix') && (
            <div>
              <Label for="namePrefix">Prefix</Label>
              <Input
                className={styles.inputSmall}
                style={{
                  width: getValues?.('namePrefix')?.length
                    ? `${getValues?.('namePrefix')?.length! + 1}ch`
                    : 'inherit',
                }}
                id="namePrefix"
                {...register('namePrefix')}
                valueState={errors.name ? 'Negative' : 'None'}
                valueStateMessage={<span>{errors.name?.message}</span>}
                value={getValues?.('namePrefix')}
                disabled
              />
            </div>
          )}
          <div>
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
          </div>
          {getValues?.('nameSuffix') && (
            <div>
              <Label for="nameSufix">Suffix</Label>
              <Input
                className={styles.inputSmall}
                id="namePrefix"
                {...register('nameSuffix')}
                valueState={errors.name ? 'Negative' : 'None'}
                valueStateMessage={<span>{errors.name?.message}</span>}
                value={getValues?.('nameSuffix')}
                disabled
              />
            </div>
          )}
        </FlexBox>
        <Label for={'displayName'}>
          {t('CreateProjectWorkspaceDialog.displayNameLabel')}
        </Label>
        <Input
          id="displayName"
          {...register('displayName')}
          className={styles.input}
        />
        <Label for={'chargingTargetType'} required={requireChargingTarget}>
          {t('CreateProjectWorkspaceDialog.chargingTargetTypeLabel')}
        </Label>
        <Select
          id={'chargingTargetType'}
          className={styles.input}
          onChange={handleChargingTargetTypeChange}
        >
          {chargingTypes.map((option) => (
            <Option key={option.value} data-value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
        <Label for={'chargingTarget'} required={requireChargingTarget}>
          {t('CreateProjectWorkspaceDialog.chargingTargetLabel')}
        </Label>
        <Input
          id="chargingTarget"
          {...register('chargingTarget')}
          className={styles.input}
        />
      </FormGroup>

      {sideFormContent ? sideFormContent : null}
    </Form>
  );
}
