import { ReactNode } from 'react';
import { AuthProvider, AuthProviderProps } from 'react-oidc-context';
import { OIDCConfig, useFrontendConfig } from './FrontendConfigContext.tsx';
import { WebStorageStateStore } from 'oidc-client-ts';

interface AuthProviderOnboardingProps {
  children?: ReactNode;
}

export function AuthProviderOnboarding({
  children,
}: AuthProviderOnboardingProps) {
  const { oidcConfig } = useFrontendConfig();

  const authConfig = buildAuthProviderConfig(oidcConfig);
  return <AuthProvider {...authConfig}>{children}</AuthProvider>;
}

function buildAuthProviderConfig(oidcConfig: OIDCConfig) {
  const userStore = new WebStorageStateStore({ store: window.localStorage });

  const props: AuthProviderProps = {
    authority: oidcConfig.issuerUrl,
    client_id: oidcConfig.clientId,
    redirect_uri: window.location.origin,
    scope: oidcConfig.scopes.join(' '),
    userStore: userStore,
    automaticSilentRenew: false, // we show a window instead that asks the user to renew the token
    onSigninCallback: () => {
      window.history.replaceState({}, document.title, window.location.pathname);
    },
  };
  return props;
}
