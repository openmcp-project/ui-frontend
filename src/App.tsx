import AppRouter from './AppRouter';
import { useAuthOnboarding } from './spaces/onboarding/auth/AuthContextOnboarding.tsx';
import '@ui5/webcomponents-icons/dist/AllIcons.d.ts';
import { SignInPage } from './spaces/onboarding/pages/SignInPage/SignInPage.tsx';
import { BusyIndicator } from '@ui5/webcomponents-react';
import * as Sentry from '@sentry/react';

function App() {
  const auth = useAuthOnboarding();

  if (auth.isLoading) {
    return <BusyIndicator active />;
  }

  if (!auth.isAuthenticated) {
    return <SignInPage />;
  }

  Sentry.setUser({
    email: auth.user?.email,
  });

  return <AppRouter />;
}

export default Sentry.withProfiler(App);
