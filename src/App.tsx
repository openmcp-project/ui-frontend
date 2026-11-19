import * as Sentry from '@sentry/react';
import '@ui5/webcomponents-icons/dist/AllIcons.d.ts';
import { BusyIndicator } from '@ui5/webcomponents-react';
import { useEffect } from 'react';
import AppRouter from './AppRouter';
import { useFrontendConfig } from './context/FrontendConfigContext.tsx';
import { useAuthOnboarding } from './spaces/onboarding/auth/AuthContextOnboarding.tsx';
import { SignInPage } from './spaces/onboarding/pages/SignInPage/SignInPage.tsx';

function App() {
  const auth = useAuthOnboarding();
  const { branding } = useFrontendConfig();

  useEffect(() => {
    document.title = branding.appName;
  }, [branding.appName]);

  if (auth.isPending) {
    return <BusyIndicator active />;
  }

  if (!auth.isAuthenticated) {
    return <SignInPage />;
  }

  Sentry.setUser({
    email: auth.user?.email,
  });

  Sentry.setContext('auth', {
    isAuthenticated: auth.isAuthenticated,
    isPending: auth.isPending,
  });

  return <AppRouter />;
}

export default Sentry.withProfiler(App);
