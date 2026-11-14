import { useContext } from 'react';
import useSWR, { useSWRConfig, type Key } from 'swr';
import { fetchApiServerJson } from '../fetch.ts';
import { ApiConfigContext } from '../../../components/Shared/k8s/index.ts';
import type { ApiConfig } from '../types/apiConfig.ts';

export type AccessState = 'allowed' | 'denied' | 'unknown';

export interface AccessAttributes {
  verb: 'get' | 'list' | 'create' | 'update' | 'patch' | 'delete';
  group: string; // '' for core
  resource: string; // plural, e.g. 'controlplanes'
  namespace?: string;
  name?: string;
}

export interface UseCanIOptions {
  /**
   * Which cluster to ask. 'mcp' uses the ApiConfigContext value (the control
   * plane cluster with the current IdP); 'onboarding' asks the onboarding
   * cluster regardless of context. Defaults to 'onboarding'.
   */
  target?: 'onboarding' | 'mcp';
  /**
   * A fast local hint. 'allowed' short-circuits to allowed without a request
   * (e.g. an exact User email match in a member list). A hint of 'denied' is
   * ignored on purpose: a member list can never prove a deny.
   */
  hint?: AccessState;
  /** When false, no request is made and the state stays 'unknown'. Defaults to true. */
  enabled?: boolean;
}

const SSAR_PATH = '/apis/authorization.k8s.io/v1/selfsubjectaccessreviews';

interface SsarResponse {
  status?: {
    allowed?: boolean;
    denied?: boolean;
    evaluationError?: string;
    reason?: string;
  };
}

/**
 * The SWR key for a given access check. Exported so `markAccessDenied` can
 * target the exact cache entry. The key intentionally includes every SSAR
 * attribute because — unlike `useApiResource` — two reviews with different
 * attributes must not share a cache entry (the POST body is what differs).
 */
export function canIKey(attrs: AccessAttributes, target: 'onboarding' | 'mcp', mcpConfig: ApiConfig['mcpConfig']): Key {
  return [
    'ssar',
    target,
    target === 'mcp' ? (mcpConfig ?? null) : null,
    attrs.verb,
    attrs.group,
    attrs.resource,
    attrs.namespace ?? null,
    attrs.name ?? null,
  ];
}

function mapStatus(res: SsarResponse): AccessState {
  const status = res.status;
  if (!status) return 'unknown';
  if (status.evaluationError) return 'unknown';
  if (status.allowed === true) return 'allowed';
  if (status.allowed === false) return 'denied';
  return 'unknown';
}

async function runSsar(attrs: AccessAttributes, config: ApiConfig): Promise<SsarResponse> {
  const body = JSON.stringify({
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    spec: {
      resourceAttributes: {
        verb: attrs.verb,
        group: attrs.group,
        resource: attrs.resource,
        ...(attrs.namespace ? { namespace: attrs.namespace } : {}),
        ...(attrs.name ? { name: attrs.name } : {}),
      },
    },
  });

  return fetchApiServerJson<SsarResponse>(SSAR_PATH, config, undefined, 'POST', body);
}

/**
 * Ask the cluster whether the current user may perform an action, via a
 * SelfSubjectAccessReview. Returns a tri-state: only a confirmed `denied`
 * should disable a control; `unknown` behaves like `allowed`.
 *
 * Pass `attrs: null` to skip the check entirely.
 */
export function useCanI(
  attrs: AccessAttributes | null,
  options?: UseCanIOptions,
): { state: AccessState; isChecking: boolean } {
  const target = options?.target ?? 'onboarding';
  const enabled = options?.enabled ?? true;
  const hint = options?.hint;
  const contextConfig = useContext(ApiConfigContext);

  // An 'allowed' hint is proof enough; don't spend a request on it.
  const hintAllows = hint === 'allowed';

  const shouldFetch = enabled && attrs !== null && !hintAllows;

  const key = shouldFetch && attrs ? canIKey(attrs, target, contextConfig.mcpConfig) : null;

  const { data, error, isLoading } = useSWR<SsarResponse>(
    key,
    () => {
      const config: ApiConfig = target === 'mcp' ? contextConfig : { mcpConfig: undefined };
      return runSsar(attrs as AccessAttributes, config);
    },
    {
      dedupingInterval: 60_000,
      revalidateOnFocus: true,
      errorRetryCount: 1,
      keepPreviousData: true,
    },
  );

  if (hintAllows) {
    return { state: 'allowed', isChecking: false };
  }

  if (!shouldFetch) {
    return { state: 'unknown', isChecking: false };
  }

  if (error) {
    return { state: 'unknown', isChecking: false };
  }

  if (data === undefined) {
    return { state: 'unknown', isChecking: isLoading };
  }

  return { state: mapStatus(data), isChecking: isLoading };
}

/**
 * Hook returning a stable `markAccessDenied(key)` that forces an SSAR cache
 * entry to a denied state. Call it from action error handlers when a real
 * request returns 403, so the corresponding control disables from then on.
 *
 * Build the `key` with `canIKey(attrs, target, mcpConfig)`.
 */
export function useMarkAccessDenied(): (key: Key) => void {
  const { mutate } = useSWRConfig();
  return (key: Key) => {
    const deniedResponse: SsarResponse = { status: { allowed: false } };
    void mutate(key, deniedResponse, { revalidate: false });
  };
}
