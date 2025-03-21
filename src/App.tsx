import AppRouter from './AppRouter';
import { useAuth } from 'react-oidc-context';
import LoginView from './views/Login';
import '@ui5/webcomponents-icons/dist/AllIcons.d.ts';
import { useEffect, useState } from 'react';
import { SessionExpiringDialog } from './components/Dialogs/SessionExpiringDialog.tsx';
import { useFrontendConfig } from './context/FrontendConfigContext.tsx';
import { useTranslation } from 'react-i18next';

function App() {
  const auth = useAuth();
  const [dialogSessionExpiringIsOpen, setDialogSessionExpiringIsOpen] =
    useState(false);
  const { t } = useTranslation();

  const [hasActiveSession, setHasActiveSession] = useState(
    auth.isAuthenticated,
  );

  useEffect(() => {
    setHasActiveSession(auth.isAuthenticated);
  }, [auth.isAuthenticated]);

  useEffect(() => {
    const unregisterAccessTokenExpiring = auth.events.addAccessTokenExpiring(
      () => {
        setDialogSessionExpiringIsOpen(true);
      },
    );
    const unregisterAccessTokenExpired = auth.events.addAccessTokenExpired(
      () => {
        console.error('access token expired, show login view');
        setDialogSessionExpiringIsOpen(false);
        setHasActiveSession(false);
      },
    );

    return () => {
      unregisterAccessTokenExpiring();
      unregisterAccessTokenExpired();
    };
  }, [auth.events]);

  const frontendConfig = useFrontendConfig();

  useEffect(() => {
    if (frontendConfig && frontendConfig.landscape) {
      document.title = `[${frontendConfig.landscape}] MCP`;
    }
  }, []);

  if (auth.isLoading) {
    return <div>{t('App.loading')}</div>;
  }

  if (!hasActiveSession) {
    return (
      <>
        <LoginView />
      </>
    );
  }

  return (
    <>
      <SessionExpiringDialog
        isOpen={dialogSessionExpiringIsOpen}
        setIsOpen={setDialogSessionExpiringIsOpen}
      />
      <AppRouter />
    </>
  );
}

export default App;
