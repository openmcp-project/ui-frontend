import { Button, Dialog } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';

interface Props {
  open: boolean;
  onLogin: () => void;
}

export function SessionExpiredDialog({ open, onLogin }: Props) {
  const { t } = useTranslation();
  return (
    <Dialog
      open={open}
      headerText={t('SessionExpiredDialog.title')}
      footer={
        <Button design="Emphasized" onClick={onLogin}>
          {t('SessionExpiredDialog.loginButton')}
        </Button>
      }
    >
      <p style={{ margin: '1rem' }}>{t('SessionExpiredDialog.message')}</p>
    </Dialog>
  );
}
