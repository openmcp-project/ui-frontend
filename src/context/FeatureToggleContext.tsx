import { ReactNode, createContext, use } from 'react';

interface FeatureToggles {
  mark_mcp_v1_as_deprecated: boolean;
}

export const FeatureToggleContext = createContext<FeatureToggles | null>(null);

interface FeatureToggleProviderProps {
  children: ReactNode;
}

function parseBoolean(value: string | undefined): boolean {
  return value === 'true';
}

function getFeatureToggles(): FeatureToggles {
  return {
    mark_mcp_v1_as_deprecated: parseBoolean(import.meta.env.VITE_MARK_MCP_V1_AS_DEPRECATED),
  };
}

export function FeatureToggleProvider({ children }: FeatureToggleProviderProps) {
  const featureToggles = getFeatureToggles();
  return <FeatureToggleContext.Provider value={featureToggles}>{children}</FeatureToggleContext.Provider>;
}

/**
 * Hook to access feature toggles throughout the application.
 * @returns Object containing all feature toggle flags
 * @throws Error if used outside FeatureToggleProvider
 * @example
 * ```tsx
 * const { mark_mcp_v1_as_deprecated } = useFeatureToggle();
 * if (mark_mcp_v1_as_deprecated) {
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
