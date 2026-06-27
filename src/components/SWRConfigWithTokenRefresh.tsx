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
        // component re-renders on refresh state changes, so the closure is not stale
        isPaused: () => isRefreshing,
      }}
    >
      {children}
    </SWRConfig>
  );
}
