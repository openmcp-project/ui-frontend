import { FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form';
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
} from '@ui5/webcomponents-react';
import styles from './CreateProjectWorkspaceDialog.module.css';
import React from 'react';

export interface MetadataFormProps {
  register: UseFormRegister<CreateDialogProps>;
  errors: FieldErrors<CreateDialogProps>;
  setValue: UseFormSetValue<CreateDialogProps>;
  sideFormContent?: React.ReactNode;
}

interface SelectOption {
  label: string;
  value: string;
}
const chargingTypes: SelectOption[] = [
  { label: 'None', value: '' },
  { label: 'SAP Business Technology Platform', value: 'btp' },
];

export function MetadataForm({
  register,
  errors,
  setValue,
  sideFormContent,
}: MetadataFormProps) {
  const { t } = useTranslation();
  const handleChargingTargetTypeChange = (
    event: Ui5CustomEvent<SelectDomRef, { selectedOption: HTMLElement }>,
  ) => {
    const selectedOption = event.detail.selectedOption as HTMLElement;
    setValue('chargingTargetType', selectedOption.dataset.value);
  };
  return (
    <Form>
      <FormGroup
        headerText={t('CreateProjectWorkspaceDialog.metadataHeader')}
        columnSpan={12}
      >
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
        <Label for={'displayName'}>
          {t('CreateProjectWorkspaceDialog.displayNameLabel')}
        </Label>
        <Input
          id="displayName"
          {...register('displayName')}
          className={styles.input}
        />
        <Label for={'chargingTargetType'} required>
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
        <Label for={'chargingTarget'} required>
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
