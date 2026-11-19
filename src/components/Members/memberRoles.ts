import type { CustomRolesState } from './MemberAccessSelect.tsx';

/**
 * The ClusterRoles the member table should treat as existing, so missing roles are flagged.
 *
 * - v1 (project/workspace): never flag anything.
 * - v2: an explicit `fromProps` value (e.g. precomputed for the ShellBar popover) wins. Otherwise
 *   use the lookup's `all`, but only once the lookup is `'ready'`. While `'loading'`, `'unknown'`
 *   or `'error'` the result is `undefined` — nothing is flagged. An empty array would wrongly mark
 *   every role as missing.
 */
export function resolveExistingClusterRoles(
  isV2: boolean,
  state: CustomRolesState,
  all: string[],
  fromProps?: string[],
): string[] | undefined {
  if (!isV2) return fromProps;
  if (fromProps !== undefined) return fromProps;
  return state === 'ready' ? all : undefined;
}
