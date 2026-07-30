import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import { Bar, Button, Dialog, Text } from '@ui5/webcomponents-react';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface DeleteProviderConfirmationDialogProps {
  open: boolean;
  providerName: string;
  memberCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteProviderConfirmationDialog: FC<DeleteProviderConfirmationDialogProps> = ({
  open,
  providerName,
  memberCount,
  onCancel,
  onConfirm,
}) => {
  const { t } = useTranslation();

  const message =
    memberCount === 0
      ? t('IdentityProviders.deleteConfirmMessageNoMembers', { providerName })
      : memberCount === 1
        ? t('IdentityProviders.deleteConfirmMessage1', { providerName })
        : t('IdentityProviders.deleteConfirmMessageN', { providerName, count: memberCount });

  return (
    <Dialog
      open={open}
      headerText={t('IdentityProviders.deleteConfirmTitle')}
      footer={
        <Bar
          design="Footer"
          endContent={
            <>
              <Button design="Transparent" onClick={onCancel}>
                {t('buttons.cancel')}
              </Button>
              <Button design={ButtonDesign.Negative} data-testid="confirm-delete-provider-button" onClick={onConfirm}>
                {t('IdentityProviders.deleteConfirmButton')}
              </Button>
            </>
          }
        />
      }
      onClose={onCancel}
    >
      <Text>{message}</Text>
    </Dialog>
  );
};
