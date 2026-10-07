import { useApolloClient } from '@apollo/client/react';
import { useCallback } from 'react';

// Every per-service mutation (create/update/delete Crossplane, Flux, Landscaper, ESO, OCM, KRO,
// MetricsOperator) only refetches its own single-service KPI query — none of them touch the
// grid's combined GetMcpV2ComponentsList query that ControlPlaneCard's lifecycle badges read
// from. Callers that finish a batch of service mutations should invoke this afterwards so the
// badges don't go stale until an unrelated refetch happens to fire.
export function useRefreshMcpV2ComponentsList() {
  const apolloClient = useApolloClient();

  return useCallback(() => {
    void apolloClient.refetchQueries({ include: ['GetMcpV2ComponentsList'] });
  }, [apolloClient]);
}
