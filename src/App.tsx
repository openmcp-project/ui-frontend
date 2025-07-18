import AppRouter from './AppRouter';
import { useAuthOnboarding } from './spaces/onboarding/auth/AuthContextOnboarding.tsx';
import '@ui5/webcomponents-icons/dist/AllIcons.d.ts';
import { useEffect } from 'react';
import { useFrontendConfig } from './context/FrontendConfigContext.tsx';
import LoginView from './views/Login.tsx';
import { BusyIndicator } from '@ui5/webcomponents-react';
import * as Sentry from '@sentry/react';

function App() {
  const auth = useAuthOnboarding();
  const frontendConfig = useFrontendConfig();

  useEffect(() => {
    if (frontendConfig && frontendConfig.landscape) {
      document.title = `[${frontendConfig.landscape}] MCP`;
    }
  }, [frontendConfig]);

  if (auth.isLoading) {
    return <BusyIndicator active />;
  }

  if (!auth.isAuthenticated) {
    return <LoginView />;
  }

  Sentry.setUser({
    email: auth.user?.email,
  });

  return <AppRouter />;
}

export default Sentry.withProfiler(App);
