import { ReactNode, createContext, use } from 'react';
import { DocLinkCreator } from '../lib/shared/links';

export enum Landscape {
  Live = 'LIVE',
  Canary = 'CANARY',
  Staging = 'STAGING',
  Development = 'DEV',
  Local = 'LOCAL',
}

export interface OIDCConfig {
  clientId: string;
  issuerUrl: string;
  scopes: string[];
}

type FrontendConfig = {
  backendUrl: string;
  gatewayUrl: string;
  landscape?: Landscape;
  documentationBaseUrl: string;
  oidcConfig: OIDCConfig;
}

interface FrontendConfigContextType extends FrontendConfig {
  links: DocLinkCreator;
}

export const FrontendConfigContext = createContext<FrontendConfigContextType | null>(
  null,
);


const fetchPromise = fetch('/frontend-config.json').then((res) => res.json()).then((data) => validateAndCastFrontendConfig(data));

interface FrontendConfigProviderProps {
  children: ReactNode;
}

export function FrontendConfigProvider({ children }: FrontendConfigProviderProps) {
  const config = use(fetchPromise);
  const docLinks = new DocLinkCreator(config.documentationBaseUrl);
  const value: FrontendConfigContextType = {
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

function validateAndCastFrontendConfig(config: unknown): FrontendConfig {
  if (typeof config !== 'object' || config === null) {
    throw new Error('Invalid frontend config');
  }
  const castedConfig = config as FrontendConfig;
  if (!castedConfig.backendUrl) {
    throw new Error('Invalid frontend config: missing backendUrl');
  }
  if (!castedConfig.gatewayUrl) {
    throw new Error('Invalid frontend config: missing gatewayUrl');
  }
  if (!castedConfig.documentationBaseUrl) {
    throw new Error('Invalid frontend config: missing documentationBaseUrl');
  }
  if (!castedConfig.oidcConfig) {
    throw new Error('Invalid frontend config: missing oidcConfig');
  }
  if (typeof castedConfig.oidcConfig !== 'object' || castedConfig.oidcConfig === null) {
    throw new Error('Invalid frontend config: oidcConfig is not an object');
  }
  if (!castedConfig.oidcConfig.clientId) {
    throw new Error('Invalid frontend config: missing clientId in oidcConfig');
  }
  if (!castedConfig.oidcConfig.issuerUrl) {
    throw new Error('Invalid frontend config: missing issuerUrl in oidcConfig');
  }
  if (!castedConfig.oidcConfig.scopes) {
    throw new Error('Invalid frontend config: missing scopes in oidcConfig');
  }
  if (!Array.isArray(castedConfig.oidcConfig.scopes)) {
    throw new Error('Invalid frontend config: scopes in oidcConfig is not an array');
  }
  if (castedConfig.landscape && !Object.values(Landscape).includes(castedConfig.landscape)) {
    throw new Error('Invalid frontend config: invalid landscape');
  }

  return castedConfig;
}