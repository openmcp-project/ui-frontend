import { ReactNode, createContext, use } from 'react';
import { z } from 'zod';
import * as Sentry from '@sentry/react';

export enum Landscape {
  Live = 'LIVE',
  Canary = 'CANARY',
  Staging = 'STAGING',
  Development = 'DEV',
  Local = 'LOCAL',
}

export const FrontendConfigContext = createContext<FrontendConfig | null>(null);

const fetchPromise = fetch('/frontend-config.json')
  .then((res) => {
    if (!res.ok) {
      throw new Error(`Failed to load frontend-config.json: ${res.status}`);
    }
    return res.json();
  })
  .then((data) => validateAndCastFrontendConfig(data))
  .catch((err) => {
    Sentry.captureException(err, {
      extra: {
        context: 'FrontendConfigContext:fetchFrontendConfig',
        path: '/frontend-config.json',
        method: 'GET',
      },
    });
    throw err;
  });

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

// Use z.string() (NOT .url()) — data: URIs fail URL validation but are valid here (img-src 'self' data: in CSP).
// Restrict to safe schemes: https, http, and data:image/* only.
const safeImageUri = z
  .string()
  .nullable()
  .refine((v) => v === null || /^(https?:|data:image\/)/i.test(v), {
    message: 'URI must use https, http, or data:image/ scheme',
  });

const BrandingSchema = z.object({
  appName: z.string().default('Control Plane UI'),
  portalName: z.string().default('the portal'),
  logo: safeImageUri.default(null),
  primaryColor: z.string().nullable().default(null),
  favicon: safeImageUri.default(null),
});

export const defaultBranding = BrandingSchema.parse({});

const FrontendConfigSchema = z.object({
  documentationBaseUrl: z.string(),
  githubBaseUrl: z.string(),
  feedbackUrl: z
    .string()
    .nullable()
    .default(null)
    .refine((v) => v === null || /^https?:/i.test(v), { message: 'feedbackUrl must use https or http scheme' }),
  landscape: z.optional(z.nativeEnum(Landscape)),
  mcp2DocsUrl: z.string().optional(),
  branding: BrandingSchema.default(defaultBranding),
  featureToggles: z
    .object({
      markMcpV1asDeprecated: z.boolean().default(false),
      enableMcpV2: z.boolean().default(false),
      enableHeadlamp: z.boolean().default(false),
      showLandscaperCard: z.boolean().default(false),
    })
    .default({
      markMcpV1asDeprecated: false,
      enableMcpV2: false,
      enableHeadlamp: false,
      showLandscaperCard: false,
    }),
});
type FrontendConfig = z.infer<typeof FrontendConfigSchema>;

function validateAndCastFrontendConfig(config: unknown): FrontendConfig {
  try {
    return FrontendConfigSchema.parse(config);
  } catch (error) {
    throw new Error(`Invalid frontend config: ${error}`);
  }
}
