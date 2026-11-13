import { useContext } from 'react';
import { useSWRConfig } from 'swr';
import { ApiConfigContext } from '../../../components/Shared/k8s';
import { useApiResource } from '../../../lib/api/useApiResource';
import { ClusterRoleListItem, ListClusterRoles } from '../../../lib/api/types/k8s/listClusterRoles.ts';
import type { CustomRolesState } from '../../../components/Members/MemberAccessSelect.tsx';

export interface ClusterRolesLookup {
  state: CustomRolesState;
  /** Every ClusterRole name, for existence checks (incl. `system:` roles). */
  all: string[];
  /** `all` without Kubernetes' internal `system:` roles — the names worth suggesting. */
  selectable: string[];
  /** Names of ClusterRoles with an aggregationRule (their rules are controller-managed). */
  aggregated: string[];
  refresh: () => void;
}

/**
 * Looks up the ClusterRoles that exist in a ControlPlane (v2), for the member dialog and table.
 *
 * It runs the request **only** when the active {@link ApiConfigContext} targets a control plane
 * (`mcpConfig !== undefined`): a lookup fired without a control-plane session would send the user
 * through `redirectToLogin('mcp')` (see `fetchApiServer`). Everywhere else — the workspace list,
 * the create wizard, a card's edit wizard — `mcpConfig` is `undefined`, so no request is made and
 * the state stays `'unknown'`.
 *
 * Any failure (including 403) maps to `'error'`: the UI then checks nothing and says so. SWR is
 * configured to never retry, so a 403 cannot loop. Request failures are not reported to telemetry
 * (routine 4xx/5xx — telemetry axis 2).
 */
export function useClusterRoles(): ClusterRolesLookup {
  const apiConfig = useContext(ApiConfigContext);
  const enabled = apiConfig.mcpConfig !== undefined;

  const { data, error, isLoading } = useApiResource<ClusterRoleListItem[]>(
    ListClusterRoles,
    { shouldRetryOnError: false, revalidateOnFocus: false },
    undefined,
    !enabled,
  );

  const { mutate } = useSWRConfig();
  const refresh = () => {
    void mutate([ListClusterRoles.path, apiConfig, undefined, ListClusterRoles.jq]);
  };

  if (!enabled) {
    return { state: 'unknown', all: [], selectable: [], aggregated: [], refresh };
  }
  if (error) {
    return { state: 'error', all: [], selectable: [], aggregated: [], refresh };
  }
  if (isLoading || !data) {
    return { state: 'loading', all: [], selectable: [], aggregated: [], refresh };
  }

  const all = data.map((item) => item.metadata.name);
  const selectable = all.filter((name) => !name.startsWith('system:'));
  const aggregated = data.filter((item) => item.aggregated).map((item) => item.metadata.name);

  return { state: 'ready', all, selectable, aggregated, refresh };
}
