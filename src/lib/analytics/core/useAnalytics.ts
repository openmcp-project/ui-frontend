import { createContext, useContext } from 'react';
import type { AnalyticsContextValue } from './types';

/**
 * React context for analytics
 * Provides access to the configured analytics adapter
 */
export const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

/**
 * Hook to access analytics in React components
 * @returns Analytics adapter with tracking methods
 * @throws Error if used outside AnalyticsProvider
 * @example
 * const analytics = useAnalytics();
 * analytics.trackEvent('Button Clicked', { button: 'create' });
 */
export function useAnalytics(): AnalyticsContextValue {
  const context = useContext(AnalyticsContext);

  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }

  return context;
}

/**
 * Optional hook that returns analytics or null if not available
 * Useful for components that work with or without analytics
 */
export function useAnalyticsOptional(): AnalyticsContextValue | null {
  return useContext(AnalyticsContext);
}
