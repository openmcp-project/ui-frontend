import { ReactNode, useState } from 'react';
import { Bar, Button, Dialog, Input, InputDomRef, Label } from '@ui5/webcomponents-react';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import { Trans, useTranslation } from 'react-i18next';

import styles from './DeleteConfirmationDialog.module.css';
import type { Ui5CustomEvent } from '@ui5/webcomponents-react-base';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  resourceName: string;
  kubectl: ReactNode;
  onDeletionConfirmed?: () => void;
  onCanceled?: () => void;
}

export function DeleteConfirmationDialog({
  isOpen,
  setIsOpen,
  resourceName,
  onDeletionConfirmed,
  onCanceled,
  kubectl,
}: DeleteConfirmationDialogProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const { t } = useTranslation();

  const onConfirmationInputChange = (event: Ui5CustomEvent<InputDomRef>) => {
    setConfirmationText(event.target.value);
  };

  const isConfirmed = confirmationText === resourceName;

  return (
    <Dialog
      stretch={false}
      headerText={t('DeleteConfirmationDialog.header', { resourceName })}
      open={isOpen}
      footer={
        <Bar
          design="Footer"
          endContent={
            <>
              <Button
                design={ButtonDesign.Transparent}
                onClick={() => {
                  setIsOpen(false);
                  onCanceled && onCanceled();
                }}
              >
                {t('DeleteConfirmationDialog.cancelButton')}
              </Button>
              <Button
                design={ButtonDesign.Negative}
                disabled={!isConfirmed}
                onClick={() => {
                  setIsOpen(false);
                  onDeletionConfirmed && onDeletionConfirmed();
                }}
              >
                {t('DeleteConfirmationDialog.deleteButton')}
              </Button>
              {kubectl}
            </>
          }
        />
      }
    >
      <div className={styles.dialogContent}>
        <span className={styles.message}>
          <Trans
            i18nKey="DeleteConfirmationDialog.deleteMessage"
            values={{ resourceName }}
            components={{
              b: <b />,
            }}
          />
        </span>
        <Label className={styles.confirmLabel} for="mcp-name-input">
          {t('DeleteConfirmationDialog.deleteConfirmation', { resourceName })}
        </Label>
        <Input
          id="mcp-name-input"
          value={confirmationText}
          className={styles.confirmationInput}
          onInput={onConfirmationInputChange}
        />
      </div>
    </Dialog>
  );
}
