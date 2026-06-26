import { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { useIsRefreshInProgress as useIsOnboardingRefreshInProgress } from '../spaces/onboarding/auth/tokenRefresh';
import { useIsRefreshInProgress as useIsMcpRefreshInProgress } from '../spaces/mcp/auth/tokenRefresh';

/**
 * SWR configuration wrapper that pauses data fetching during token refresh.
 */
export function SWRConfigWithTokenRefresh({ children }: { children: ReactNode }) {
  const onboardingRefreshing = useIsOnboardingRefreshInProgress();
  const mcpRefreshing = useIsMcpRefreshInProgress();
  const isRefreshing = onboardingRefreshing || mcpRefreshing;

  return (
    <SWRConfig
      value={{
        refreshInterval: 10000,
        // Tab-focus / network-reconnect revalidation double-spends on top of
        // the 10s poll. Per-hook overrides still apply.
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        // Share back-to-back mounts within a navigation.
        dedupingInterval: 30_000,
        // component re-renders on refresh state changes, so the closure is not stale
        isPaused: () => isRefreshing,
      }}
    >
      {children}
    </SWRConfig>
  );
}
