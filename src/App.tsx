import AppRouter from './AppRouter';
import { useAuth } from './spaces/onboarding/auth/AuthContext.tsx';
import '@ui5/webcomponents-icons/dist/AllIcons.d.ts';
import { useEffect } from 'react';
import { useFrontendConfig } from './context/FrontendConfigContext.tsx';
import { useTranslation } from 'react-i18next';
import LoginView from './views/Login.tsx';

function App() {
  const auth = useAuth();
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
    return <LoginView />;
  }

  return <AppRouter />;
}

export default App;
