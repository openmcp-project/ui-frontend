import { ReactNode, createContext, use } from 'react';
import { z } from 'zod';

export enum Landscape {
  Live = 'LIVE',
  Canary = 'CANARY',
  Staging = 'STAGING',
  Development = 'DEV',
  Local = 'LOCAL',
}

export const FrontendConfigContext = createContext<FrontendConfig | null>(null);

const fetchPromise = fetch('/frontend-config.json')
  .then((res) => res.json())
  .then((data) => validateAndCastFrontendConfig(data));

interface FrontendConfigProviderProps {
  children: ReactNode;
}

export function FrontendConfigProvider({ children }: FrontendConfigProviderProps) {
  const config = use(fetchPromise);
  return <FrontendConfigContext.Provider value={config}>{children}</FrontendConfigContext.Provider>;
}

export const useFrontendConfig = () => {
  const context = use(FrontendConfigContext);

  if (!context) {
    throw new Error('useFrontendConfig must be used within a FrontendConfigProvider.');
  }
  return context;
};

const FrontendConfigSchema = z.object({
  gatewayUrl: z.string(),
  documentationBaseUrl: z.string(),
  githubBaseUrl: z.string(),
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
