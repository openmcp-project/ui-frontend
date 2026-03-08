import { ReactNode, createContext, use } from 'react';
import { useFrontendConfig } from './FrontendConfigContext';

interface FeatureToggles {
  markMcpV1asDeprecated: boolean;
}

export const FeatureToggleContext = createContext<FeatureToggles | null>(null);

interface FeatureToggleProviderProps {
  children: ReactNode;
}

export function FeatureToggleProvider({ children }: FeatureToggleProviderProps) {
  const { featureToggles } = useFrontendConfig();
  return <FeatureToggleContext.Provider value={featureToggles}>{children}</FeatureToggleContext.Provider>;
}

/**
 * Hook to access feature toggles throughout the application.
 * @returns Object containing all feature toggle flags
 * @throws Error if used outside FeatureToggleProvider
 * @example
 * ```tsx
 * const { markMcpV1asDeprecated } = useFeatureToggle();
 * if (markMcpV1asDeprecated) {
 *   // Show deprecated warning
 * }
 * ```
 */
export const useFeatureToggle = () => {
  const context = use(FeatureToggleContext);

  if (!context) {
    throw new Error('useFeatureToggle must be used within a FeatureToggleProvider.');
  }
  return context;
};
