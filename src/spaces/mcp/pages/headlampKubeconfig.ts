import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

/**
 * Prepares a kubeconfig for Headlamp's stateless/dynamic cluster mode.
 *
 * - Strips all credential fields (exec, auth-provider, token, client-cert, client-key)
 *   because the BFF proxy injects the bearer token server-side on every proxied request.
 * - Renames the cluster, context, and user entries to `clusterAlias` so that each MCP
 *   gets its own distinct entry in Headlamp's cache. Without this, two MCPs backed
 *   by the same upstream cluster share a single cached entry.
 */
export function prepareKubeconfigForHeadlamp(rawKubeconfig: string, clusterAlias: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let kc: any;
  try {
    kc = parseYaml(rawKubeconfig);
  } catch {
    return rawKubeconfig;
  }

  if (!kc || typeof kc !== 'object') return rawKubeconfig;

  // Rename the first cluster entry
  if (Array.isArray(kc.clusters) && kc.clusters.length > 0) {
    kc.clusters = kc.clusters.slice(0, 1).map((c: any) => ({ ...c, name: clusterAlias }));
  }

  // Rename the first user entry and strip all credentials
  if (Array.isArray(kc.users) && kc.users.length > 0) {
    kc.users = kc.users.slice(0, 1).map(() => ({
      name: clusterAlias,
      user: {}, // no credentials — BFF injects the token server-side
    }));
  } else {
    kc.users = [{ name: clusterAlias, user: {} }];
  }

  // Rename the first context entry to point at the renamed cluster + user
  if (Array.isArray(kc.contexts) && kc.contexts.length > 0) {
    const firstCtx = kc.contexts[0];
    kc.contexts = [
      {
        name: clusterAlias,
        context: {
          ...(firstCtx.context ?? {}),
          cluster: clusterAlias,
          user: clusterAlias,
        },
      },
    ];
  }

  // Set current-context to the renamed context
  kc['current-context'] = clusterAlias;

  return stringifyYaml(kc);
}

/**
 * Registers the kubeconfig with the BFF so it is forwarded as the KUBECONFIG header
 * on every proxied /api/headlamp/* request. Headlamp's stateless cluster mechanism
 * will pick it up per-request — no IndexedDB or postMessage needed.
 *
 * Returns the cluster alias that was registered.
 */
export async function registerKubeconfigWithBff(rawKubeconfig: string, clusterAlias: string): Promise<string> {
  const prepared = prepareKubeconfigForHeadlamp(rawKubeconfig, clusterAlias);
  const base64 = btoa(unescape(encodeURIComponent(prepared)));
  await fetch('/api/headlamp-kubeconfig', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kubeconfig: base64 }),
  });
  return clusterAlias;
}
