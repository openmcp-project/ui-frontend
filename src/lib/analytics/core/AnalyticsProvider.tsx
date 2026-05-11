import { ReactNode, useEffect, useMemo, useState } from 'react';
import { AnalyticsContext } from './useAnalytics';
import type { AnalyticsAdapter, AnalyticsConfig, AnalyticsContextValue } from './types';

interface AnalyticsProviderProps {
  config: AnalyticsConfig;
  children: ReactNode;
}

/**
 * Provider component that initializes and provides analytics adapter to the app
 * Should be placed high in the component tree, typically in App.tsx
 *
 * @example
 * <AnalyticsProvider config={analyticsConfig}>
 *   <App />
 * </AnalyticsProvider>
 */
export function AnalyticsProvider({ config, children }: AnalyticsProviderProps) {
  const [adapter, setAdapter] = useState<AnalyticsAdapter | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load and initialize the adapter based on config
  useEffect(() => {
    let mounted = true;

    async function loadAdapter() {
      if (!config.enabled) {
        if (config.debug) {
          console.log('[Analytics] Disabled via config');
        }
        // Load noop adapter when disabled
        const { NoopAdapter } = await import('../adapters/NoopAdapter');
        if (mounted) {
          const noopAdapter = new NoopAdapter();
          await noopAdapter.initialize();
          setAdapter(noopAdapter);
          setIsInitialized(true);
        }
        return;
      }

      try {
        if (config.debug) {
          console.log(`[Analytics] Loading ${config.provider} adapter...`);
        }

        let loadedAdapter: AnalyticsAdapter;

        switch (config.provider) {
          case 'dynatrace': {
            const { DynatraceAdapter } = await import('../adapters/DynatraceAdapter');
            loadedAdapter = new DynatraceAdapter(config.debug);
            break;
          }
          case 'plausible': {
            const { PlausibleAdapter } = await import('../adapters/PlausibleAdapter');
            loadedAdapter = new PlausibleAdapter(config.debug);
            break;
          }
          case 'noop': {
            const { NoopAdapter } = await import('../adapters/NoopAdapter');
            loadedAdapter = new NoopAdapter();
            break;
          }
          default: {
            console.error(`[Analytics] Unknown provider: ${config.provider}`);
            const { NoopAdapter: FallbackNoopAdapter } = await import('../adapters/NoopAdapter');
            loadedAdapter = new FallbackNoopAdapter();
            break;
          }
        }

        if (mounted) {
          await loadedAdapter.initialize(config.config);
          setAdapter(loadedAdapter);
          setIsInitialized(true);

          if (config.debug) {
            console.log(`[Analytics] ${config.provider} adapter initialized`);
          }
        }
      } catch (error) {
        console.error('[Analytics] Failed to load adapter:', error);
        // Fallback to noop on error
        if (mounted) {
          const { NoopAdapter } = await import('../adapters/NoopAdapter');
          const noopAdapter = new NoopAdapter();
          await noopAdapter.initialize();
          setAdapter(noopAdapter);
          setIsInitialized(true);
        }
      }
    }

    loadAdapter();

    return () => {
      mounted = false;
      // Cleanup adapter if it has cleanup method
      if (adapter?.cleanup) {
        adapter.cleanup();
      }
    };
  }, [config.provider, config.enabled, config.debug, adapter, config.config]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<AnalyticsContextValue | null>(() => {
    if (!adapter || !isInitialized) {
      return null;
    }

    return {
      config,
      initialize: adapter.initialize.bind(adapter),
      trackEvent: adapter.trackEvent.bind(adapter),
      trackPageView: adapter.trackPageView.bind(adapter),
      startAction: adapter.startAction.bind(adapter),
      endAction: adapter.endAction.bind(adapter),
      addProperties: adapter.addProperties.bind(adapter),
      trackError: adapter.trackError.bind(adapter),
      isReady: adapter.isReady.bind(adapter),
      cleanup: adapter.cleanup?.bind(adapter),
    };
  }, [adapter, isInitialized, config]);

  // Don't render children until adapter is initialized
  if (!contextValue) {
    return <>{children}</>;
  }

  return <AnalyticsContext.Provider value={contextValue}>{children}</AnalyticsContext.Provider>;
}
