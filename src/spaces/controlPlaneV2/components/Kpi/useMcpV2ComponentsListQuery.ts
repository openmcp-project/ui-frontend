import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';

import { graphql } from '../../../../types/__generated__/graphql/index.ts';

/**
 * One combined query for every V2 control plane's component-install status in a workspace,
 * replacing 6 per-control-plane queries fired once per card. All V2 control planes in a workspace
 * share the same `mcpNamespace`, so this is 6 requests per workspace instead of 6 × cards.
 * `metadata.name` + `spec.version` drive `installed` status; `status.phase` drives the per-service
 * lifecycle indicator (installing / deleting) shown on the control plane card, and `status.conditions`
 * surfaces a hard reconcile error (a `Ready` condition with `status: "False"`) even while the phase is
 * still `Progressing`.
 */
const GET_MCP_V2_COMPONENTS_LIST_QUERY = graphql(`
  query GetMcpV2ComponentsList($namespace: String) {
    crossplane_services_open_control_plane_io {
      v1alpha1 {
        Crossplanes(namespace: $namespace) {
          items {
            metadata {
              name
            }
            spec {
              version
            }
            status {
              phase
              conditions {
                type
                status
                reason
                message
                lastTransitionTime
              }
            }
          }
        }
      }
    }
    flux_services_open_control_plane_io {
      v1alpha1 {
        Fluxes(namespace: $namespace) {
          items {
            metadata {
              name
            }
            spec {
              version
            }
            status {
              phase
              conditions {
                type
                status
                reason
                message
                lastTransitionTime
              }
            }
          }
        }
      }
    }
    landscaper_services_open_control_plane_io {
      v1alpha2 {
        Landscapers(namespace: $namespace) {
          items {
            metadata {
              name
            }
            spec {
              version
            }
            status {
              phase
              conditions {
                type
                status
                reason
                message
                lastTransitionTime
              }
            }
          }
        }
      }
    }
    external_secrets_services_open_control_plane_io {
      v1alpha1 {
        ExternalSecretsOperators(namespace: $namespace) {
          items {
            metadata {
              name
            }
            spec {
              version
            }
            status {
              phase
              conditions {
                type
                status
                reason
                message
                lastTransitionTime
              }
            }
          }
        }
      }
    }
    ocm_services_open_control_plane_io {
      v1alpha1 {
        OCMs(namespace: $namespace) {
          items {
            metadata {
              name
            }
            spec {
              version
            }
            status {
              phase
              conditions {
                type
                status
                reason
                message
                lastTransitionTime
              }
            }
          }
        }
      }
    }
    kro_services_open_control_plane_io {
      v1alpha1 {
        Kroes(namespace: $namespace) {
          items {
            metadata {
              name
            }
            spec {
              version
            }
            status {
              phase
              conditions {
                type
                status
                reason
                message
                lastTransitionTime
              }
            }
          }
        }
      }
    }
  }
`);

export interface McpV2ComponentStatus {
  /** Raw `status.phase` reported by the service resource (e.g. `Progressing`, `Terminating`, `Ready`). */
  phase?: string | null;
  /** Installed version from `spec.version`. */
  version?: string | null;
  /**
   * Message from a readiness condition that reports a genuine error (`status: "False"` with an
   * error-style `reason` such as `ReconcileError`, `Unhealthy`, `ComponentReconcileFailed`), or
   * null. Different services name their readiness conditions differently (`Ready`, `CrossplaneReady`,
   * `Reconciled`, …), so all of them are scanned. A service can report `phase: Progressing` while a
   * condition already spells out a hard, user-actionable error — surfacing it takes priority over
   * the phase-driven lifecycle animation. A benign in-progress `False` condition (reason
   * `Reconciling` / `Progressing`, e.g. "waiting for managed resources") is *not* an error and stays
   * null, so a healthily-installing service keeps its install animation.
   */
  errorMessage?: string | null;
  /**
   * ISO timestamp (a benignly-reconciling readiness condition's `lastTransitionTime`) for a service
   * that is installing/updating without a hard error. Lets the UI show how long it has been in
   * progress (e.g. "Reconciling for 2h"). Null when not applicable (ready, errored, or no timestamp
   * reported).
   */
  reconcilingSince?: string | null;
}

export interface McpV2Components {
  crossplane?: McpV2ComponentStatus;
  flux?: McpV2ComponentStatus;
  landscaper?: McpV2ComponentStatus;
  externalSecretsOperator?: McpV2ComponentStatus;
  ocm?: McpV2ComponentStatus;
  kro?: McpV2ComponentStatus;
}

interface StatusCondition {
  type?: string | null;
  status?: string | null;
  reason?: string | null;
  message?: string | null;
  lastTransitionTime?: string | null;
}

type ListItems =
  | readonly ({
      metadata?: { name?: string | null } | null;
      spec?: { version?: string | null } | null;
      status?: { phase?: string | null; conditions?: readonly (StatusCondition | null)[] | null } | null;
    } | null)[]
  | undefined;

/**
 * A hard reconcile error is a top-level readiness condition reporting `status: "False"` with an
 * error-style `reason` — the controller could not bring the service to its desired state (e.g. an
 * unavailable requested version, an unhealthy artifact, failed components). Its `message` is the
 * actionable text to show the user.
 *
 * A readiness condition reporting `status: "False"` is *not* always an error: while a service
 * installs or updates, the controller reports `status: "False"` with a benign reason like
 * `Reconciling` / `Progressing` ("waiting for managed resources to become ready"). Those are normal
 * in-progress states, so only a reason that clearly denotes failure counts as an error here.
 */
function isErrorReason(reason?: string | null): boolean {
  if (!reason) return false;
  // A clear failure signal wins even when the reason also reads like an in-progress one
  // (e.g. `ReconcileError` starts with "Reconcil" but is an error).
  return /error|fail|invalid|denied|forbidden|notfound|unavailable|unhealthy|notready|degraded/i.test(reason);
}

/**
 * The top-level readiness conditions of a service CR. Different OCP services name their primary
 * readiness condition differently — `Ready` (OCM, Flux), `CrossplaneReady` + `Reconciled`
 * (Crossplane), etc. — so we treat any condition whose `type` ends in `Ready`, or the aggregate
 * `Reconciled` condition, as a top-level readiness signal. The many per-provider
 * `DeploymentRuntimeConfig…Ready` / `Provider…Ready` conditions also match, which is intended: if
 * any of them fails the service is not healthy.
 */
function isReadinessCondition(type?: string | null): boolean {
  if (!type) return false;
  return /ready$/i.test(type) || type === 'Reconciled';
}

/**
 * Scans all readiness conditions and returns the actionable message of the first one that reports a
 * genuine error (`status: "False"` with an error reason such as `Unhealthy`, `ReconcileError`,
 * `ComponentReconcileFailed`). Returns null when nothing has failed.
 */
function getConditionErrorMessage(conditions?: readonly (StatusCondition | null)[] | null): string | null {
  const failing = conditions?.find(
    (c) => isReadinessCondition(c?.type) && c?.status === 'False' && isErrorReason(c?.reason),
  );
  return failing ? failing.message?.trim() || null : null;
}

/**
 * When a service is benignly reconciling (a readiness condition is `False` but *not* an error, e.g.
 * reason `Reconciling`), returns that condition's `lastTransitionTime` so the UI can show the
 * elapsed reconcile time. Returns null for a ready, errored, or timestamp-less service. Skipped
 * entirely once any condition is a genuine error, so an error never reads as "reconciling".
 */
function getReconcilingSince(conditions?: readonly (StatusCondition | null)[] | null): string | null {
  if (getConditionErrorMessage(conditions)) return null;
  const reconciling = conditions?.find(
    (c) => isReadinessCondition(c?.type) && c?.status === 'False' && !isErrorReason(c?.reason),
  );
  return reconciling ? reconciling.lastTransitionTime?.trim() || null : null;
}

function indexByName(items: ListItems, key: keyof McpV2Components, index: Record<string, McpV2Components>) {
  for (const item of items ?? []) {
    const name = item?.metadata?.name;
    if (!name || !item?.spec?.version) continue;
    (index[name] ??= {})[key] = {
      phase: item.status?.phase ?? null,
      version: item.spec.version,
      errorMessage: getConditionErrorMessage(item.status?.conditions),
      reconcilingSince: getReconcilingSince(item.status?.conditions),
    };
  }
}

/** `namespace` here is the workspace's `mcpNamespace` (`project-x--ws-y`), shared by every V2 control plane in it. */
export function useMcpV2ComponentsListQuery(namespace?: string, skip = false) {
  const queryResult = useQuery(GET_MCP_V2_COMPONENTS_LIST_QUERY, {
    variables: { namespace },
    skip: skip || !namespace,
    notifyOnNetworkStatusChange: true,
  });

  const componentsByName = useMemo<Record<string, McpV2Components>>(() => {
    const data = queryResult.data;
    const index: Record<string, McpV2Components> = {};
    indexByName(data?.crossplane_services_open_control_plane_io?.v1alpha1?.Crossplanes?.items, 'crossplane', index);
    indexByName(data?.flux_services_open_control_plane_io?.v1alpha1?.Fluxes?.items, 'flux', index);
    indexByName(data?.landscaper_services_open_control_plane_io?.v1alpha2?.Landscapers?.items, 'landscaper', index);
    indexByName(
      data?.external_secrets_services_open_control_plane_io?.v1alpha1?.ExternalSecretsOperators?.items,
      'externalSecretsOperator',
      index,
    );
    indexByName(data?.ocm_services_open_control_plane_io?.v1alpha1?.OCMs?.items, 'ocm', index);
    indexByName(data?.kro_services_open_control_plane_io?.v1alpha1?.Kroes?.items, 'kro', index);
    return index;
  }, [queryResult.data]);

  return {
    componentsByName,
    isLoading: queryResult.loading,
    error: queryResult.error,
  };
}
