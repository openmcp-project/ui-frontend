import AppRouter from './AppRouter';
import { useAuthOnboarding } from './spaces/onboarding/auth/AuthContextOnboarding.tsx';
import '@ui5/webcomponents-icons/dist/AllIcons.d.ts';
import LoginView from './views/Login.tsx';
import { BusyIndicator } from '@ui5/webcomponents-react';
import * as Sentry from '@sentry/react';

function App() {
  const auth = useAuthOnboarding();

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
