import * as Sentry from '@sentry/react';
import '@ui5/webcomponents-icons/dist/AllIcons.d.ts';
import { BusyIndicator } from '@ui5/webcomponents-react';
import AppRouter from './AppRouter';
import { useAuthOnboarding } from './spaces/onboarding/auth/AuthContextOnboarding.tsx';
import { SignInPage } from './spaces/onboarding/pages/SignInPage/SignInPage.tsx';

function App() {
  const auth = useAuthOnboarding();

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
