import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import { Bar, Button, Dialog, Text } from '@ui5/webcomponents-react';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface DiscardChangesConfirmationDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DiscardChangesConfirmationDialog: FC<DiscardChangesConfirmationDialogProps> = ({
  open,
  onCancel,
  onConfirm,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      headerText={t('discardChangesDialog.title')}
      footer={
        <Bar
          design="Footer"
          endContent={
            <>
              <Button design="Transparent" onClick={onCancel}>
                {t('discardChangesDialog.cancelButton')}
              </Button>
              <Button design={ButtonDesign.Negative} data-testid="confirm-discard-changes-button" onClick={onConfirm}>
                {t('discardChangesDialog.confirmButton')}
              </Button>
            </>
          }
        />
      }
      onClose={onCancel}
    >
      <Text>{t('discardChangesDialog.message')}</Text>
    </Dialog>
  );
};
