import { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { useIsRefreshInProgress as useIsOnboardingRefreshInProgress } from '../spaces/onboarding/auth/tokenRefresh';
import { useIsRefreshInProgress as useIsMcpRefreshInProgress } from '../spaces/mcp/auth/tokenRefresh';

/**
 * SWR configuration wrapper that pauses data fetching during token refresh.
 *
 * Tuning notes:
 * - refreshInterval: 15s (down from 10s) — halves background traffic; 15s staleness
 *   is acceptable for an ops-style UI where status changes are infrequent.
 * - revalidateOnFocus: false — eliminates the burst of re-fetches on every tab
 *   switch, which was the noisiest source of concurrent backend requests.
 * - dedupingInterval: 5000 — collapses same-key calls within a 5s window instead
 *   of the default 2s, reducing duplicate requests when multiple components mount.
 */
export function SWRConfigWithTokenRefresh({ children }: { children: ReactNode }) {
  const onboardingRefreshing = useIsOnboardingRefreshInProgress();
  const mcpRefreshing = useIsMcpRefreshInProgress();
  const isRefreshing = onboardingRefreshing || mcpRefreshing;

  return (
    <SWRConfig
      value={{
        refreshInterval: 15000,
        revalidateOnFocus: false,
        dedupingInterval: 5000,
        // component re-renders on refresh state changes, so the closure is not stale
        isPaused: () => isRefreshing,
      }}
    >
      {children}
    </SWRConfig>
  );
}
