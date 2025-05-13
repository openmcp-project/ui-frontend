import AppRouter from './AppRouter';
import { useAuth } from './spaces/onboarding/auth/AuthContext.tsx';
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

  const frontendConfig = useFrontendConfig();

  useEffect(() => {
    if (frontendConfig && frontendConfig.landscape) {
      document.title = `[${frontendConfig.landscape}] MCP`;
    }
  }, []);

  if (auth.isLoading) {
    return <div>{t('App.loading')}</div>;
  }

  if (!auth.isAuthenticated) {
    return (
      <>
        {/**<LoginView />**/}
        <button onClick={() => auth.login()}>Sign In</button>
      </>
    );
  }

  return (
    <>
      <SessionExpiringDialog
        isOpen={dialogSessionExpiringIsOpen}
        setIsOpen={setDialogSessionExpiringIsOpen}
      />
      <div>
        {auth.isAuthenticated ? 'AUTHED' : 'NOT AUTHED'}
        <button onClick={() => auth.logout()}>Sign Out</button>
      </div>
      <AppRouter />
    </>
  );
}

export default App;
