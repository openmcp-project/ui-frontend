import { Trans, useTranslation } from 'react-i18next';
import { Input, InputDomRef, Label, Ui5CustomEvent } from '@ui5/webcomponents-react';
import styles from './DeleteConfirmationForm.module.css';
import { CopyButton } from '../Shared/CopyButton.tsx';

interface DeleteConfirmationFormProps {
  resourceName: string;
  confirmationText: string;
  onConfirmationInputChange: (event: Ui5CustomEvent<InputDomRef>) => void;
  deleteMessageKey: string;
  deleteConfirmationLabel?: string;
}

export function DeleteConfirmationForm({
  resourceName,
  confirmationText,
  onConfirmationInputChange,
  deleteMessageKey,
}: DeleteConfirmationFormProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.dialogContent}>
      <span className={styles.message}>
        <Trans i18nKey={deleteMessageKey} values={{ resourceName }} components={{ b: <b /> }} />
      </span>

      <div className={styles.nameChip}>
        <span className={styles.nameText}>{resourceName}</span>
        <CopyButton text={resourceName} source="other" />
      </div>

      <Label className={styles.confirmLabel} for="delete-confirm-input">
        {t('DeleteConfirmationDialog.typeToConfirm')}
      </Label>
      <Input
        id="delete-confirm-input"
        value={confirmationText}
        className={styles.confirmationInput}
        onInput={onConfirmationInputChange}
      />
    </div>
  );
}
