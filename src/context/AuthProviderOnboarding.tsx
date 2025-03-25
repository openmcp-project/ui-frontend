import { ReactNode, use } from 'react';
import { AuthProvider, AuthProviderProps } from 'react-oidc-context';
import { useFrontendConfig } from './FrontendConfigContext.tsx';
import { LoadCrateKubeConfig } from '../lib/oidc/crate.ts';

interface AuthProviderOnboardingProps {
  children?: ReactNode;
}

// Promise needs to be cached
// https://react.dev/blog/2024/12/05/react-19#use-does-not-support-promises-created-in-render
const fetchAuthPromiseCache = new Map<string, Promise<AuthProviderProps>>();

export function AuthProviderOnboarding({
  children,
}: AuthProviderOnboardingProps) {
  const { backendUrl } = useFrontendConfig();

  const fetchAuthConfigPromise =
    fetchAuthPromiseCache.get(backendUrl) ?? LoadCrateKubeConfig(backendUrl);
  fetchAuthPromiseCache.set(backendUrl, fetchAuthConfigPromise);

  const authConfig = use(fetchAuthConfigPromise);

  return <AuthProvider {...authConfig}>{children}</AuthProvider>;
}
