import { ReactNode, createContext, use } from 'react';
import { LinkCreator } from '../lib/shared/links';
import { z } from 'zod';

export enum Landscape {
  Live = 'LIVE',
  Canary = 'CANARY',
  Staging = 'STAGING',
  Development = 'DEV',
  Local = 'LOCAL',
}

interface FrontendConfigContextType extends FrontendConfig {
  links: LinkCreator;
}

export const FrontendConfigContext =
  createContext<FrontendConfigContextType | null>(null);

const fetchPromise = fetch('/frontend-config.json')
  .then((res) => res.json())
  .then((data) => validateAndCastFrontendConfig(data));

interface FrontendConfigProviderProps {
  children: ReactNode;
}

export function FrontendConfigProvider({
  children,
}: FrontendConfigProviderProps) {
  const config = use(fetchPromise);
  const docLinks = new LinkCreator(
    config.documentationBaseUrl,
    config.githubBaseUrl,
  );
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

const OidcConfigSchema = z.object({
  clientId: z.string(),
  issuerUrl: z.string(),
  scopes: z.array(z.string()),
});
export type OIDCConfig = z.infer<typeof OidcConfigSchema>;

const FrontendConfigSchema = z.object({
  gatewayUrl: z.string(),
  documentationBaseUrl: z.string(),
  githubBaseUrl: z.string(),
  oidcConfig: OidcConfigSchema,
  landscape: z.optional(z.nativeEnum(Landscape)),
});
type FrontendConfig = z.infer<typeof FrontendConfigSchema>;

function validateAndCastFrontendConfig(config: unknown): FrontendConfig {
  try {
    return FrontendConfigSchema.parse(config);
  } catch (error) {
    throw new Error(`Invalid frontend config: ${error}`);
  }
}
