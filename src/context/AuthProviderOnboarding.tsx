import { ReactNode } from 'react';
import { AuthProvider } from 'react-oidc-context';
import { useFrontendConfig } from './FrontendConfigContext.tsx';
import { buildAuthProviderProps } from '../lib/oidc/onboardingApi.ts';

interface AuthProviderOnboardingProps {
  children?: ReactNode;
}

export function AuthProviderOnboarding({
  children,
}: AuthProviderOnboardingProps) {
  const { oidcConfig } = useFrontendConfig();

  const authConfig = buildAuthProviderProps(oidcConfig);
  return <AuthProvider {...authConfig}>{children}</AuthProvider>;
}
