import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { CreateDialogProps } from './CreateWorkspaceDialogContainer.tsx';
import { useTranslation } from 'react-i18next';
import { Form, FormGroup, Input, Label } from '@ui5/webcomponents-react';
import styles from './CreateProjectWorkspaceDialog.module.css';

export interface MetadataFormProps {
  register: UseFormRegister<CreateDialogProps>;
  errors: FieldErrors<CreateDialogProps>;

  sideFormContent?: React.ReactNode;
}

export function MetadataForm({
  register,
  errors,
  sideFormContent,
}: MetadataFormProps) {
  const { t } = useTranslation();

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

        <Label for={'chargingTarget'}>
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
