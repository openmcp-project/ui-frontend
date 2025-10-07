import { Trans } from 'react-i18next';
import { Input, InputDomRef, Label, Ui5CustomEvent } from '@ui5/webcomponents-react';
import styles from './DeleteConfirmationForm.module.css';

interface DeleteConfirmationFormProps {
  resourceName: string;
  confirmationText: string;
  onConfirmationInputChange: (event: Ui5CustomEvent<InputDomRef>) => void;
  deleteMessageKey: string;
  deleteConfirmationLabel: string;
}

export function DeleteConfirmationForm({
  resourceName,
  confirmationText,
  onConfirmationInputChange,
  deleteMessageKey,
  deleteConfirmationLabel,
}: DeleteConfirmationFormProps) {
  return (
    <div className={styles.dialogContent}>
      <span className={styles.message}>
        <Trans i18nKey={deleteMessageKey} values={{ resourceName }} components={{ b: <b /> }} />
      </span>
      <Label className={styles.confirmLabel} for="delete-confirm-input">
        {deleteConfirmationLabel}
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
