import { ReactNode, createContext, use } from 'react';
import { DocLinkCreator } from '../lib/shared/links';
import { OIDCConfig } from '../lib/oidc/onboardingApi';

export enum Landscape {
  Live = 'LIVE',
  Canary = 'CANARY',
  Staging = 'STAGING',
  Development = 'DEV',
  Local = 'LOCAL',
}

type FrontendConfig = {
  backendUrl: string;
  landscape?: Landscape;
  documentationBaseUrl: string;
  oidcConfig: OIDCConfig;
}

interface FrontendConfigContextProps extends FrontendConfig {
  links: DocLinkCreator;
}

export const FrontendConfigContext = createContext<FrontendConfigContextProps | null>(
  null,
);


const fetchPromise = fetch('/frontend-config.json').then((res) => res.json()).then((data) => data as FrontendConfig);

interface FrontendConfigProviderProps {
  children: ReactNode;
}

export function FrontendConfigProvider({ children }: FrontendConfigProviderProps) {
  const config = use(fetchPromise);
  const docLinks = new DocLinkCreator(config.documentationBaseUrl);
  const value: FrontendConfigContextProps = {
    links: docLinks,
    ...config,
  };
  return (
    <FrontendConfigContext value={value}>{children}</FrontendConfigContext>
  );
}

export const useFrontendConfig = () => {
  const context = use(FrontendConfigContext);

  if (!context) {
    throw new Error(
      'useFrontendConfig must be used within a FrontendConfigProvider.',
    );
  }
  return context;
};
