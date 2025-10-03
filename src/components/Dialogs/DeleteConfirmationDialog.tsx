import { ReactNode, useState } from 'react';
import { Bar, Button, Dialog, InputDomRef } from '@ui5/webcomponents-react';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import { useTranslation } from 'react-i18next';

import type { Ui5CustomEvent } from '@ui5/webcomponents-react-base';
import { DeleteConfirmationForm } from './DeleteConfirmationForm.tsx';

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
      <DeleteConfirmationForm
        resourceName={resourceName}
        confirmationText={confirmationText}
        deleteMessageKey="DeleteConfirmationDialog.deleteMessage"
        deleteConfirmationLabel={t('DeleteConfirmationDialog.deleteConfirmation', { resourceName })}
        onConfirmationInputChange={onConfirmationInputChange}
      />
    </Dialog>
  );
}
