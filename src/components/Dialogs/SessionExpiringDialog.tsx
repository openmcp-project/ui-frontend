import {
  Bar,
  Dialog,
  Text,
  Toolbar,
  ToolbarButton,
} from '@ui5/webcomponents-react';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import { useTranslation } from 'react-i18next';
import { useAuth } from 'react-oidc-context';

interface SessionExpiringDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function SessionExpiringDialog({
  isOpen,
  setIsOpen,
}: SessionExpiringDialogProps) {
  const auth = useAuth();
  const { t } = useTranslation();

  return (
    <>
      <Dialog
        stretch={false}
        headerText={t('SessionExpiringDialog.dialogHeader')}
        open={isOpen}
        footer={
          <Bar
            design="Footer"
            endContent={
              <Toolbar>
                <ToolbarButton
                  text={t('SessionExpiringDialog.signOutButton')}
                  design={ButtonDesign.Transparent}
                  onClick={() => {
                    setIsOpen(false);
                    auth.signoutSilent();
                    auth.removeUser();
                  }}
                />
                <ToolbarButton
                  text={t('SessionExpiringDialog.stayButton')}
                  design={ButtonDesign.Emphasized}
                  onClick={() => {
                    setIsOpen(false);
                    auth.signinSilent();
                  }}
                />
              </Toolbar>
            }
          />
        }
      >
        <Text>{t('SessionExpiringDialog.sessionText')}</Text>
      </Dialog>
    </>
  );
}
