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
  let kc: Record<string, unknown>;
  try {
    const parsed = parseYaml(rawKubeconfig);
    if (!parsed || typeof parsed !== 'object') return rawKubeconfig;
    kc = parsed as Record<string, unknown>;
  } catch {
    return rawKubeconfig;
  }

  type NamedEntry = { name: string; [key: string]: unknown };

  // Rename the first cluster entry
  if (Array.isArray(kc.clusters) && kc.clusters.length > 0) {
    kc.clusters = kc.clusters.slice(0, 1).map((c: NamedEntry) => ({ ...c, name: clusterAlias }));
  }

  // Rename the first user entry and strip all credentials
  kc.users = [{ name: clusterAlias, user: {} }];

  // Rename the first context entry to point at the renamed cluster + user
  if (Array.isArray(kc.contexts) && kc.contexts.length > 0) {
    const firstCtx = kc.contexts[0] as { context?: Record<string, unknown> };
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

function toBase64(str: string): string {
  return btoa(new TextEncoder().encode(str).reduce((s, b) => s + String.fromCharCode(b), ''));
}

/**
 * Registers the kubeconfig with:
 *  1. The BFF session — so it forwards the KUBECONFIG header on every proxied
 *     /api/headlamp/* request (server-side token injection).
 *  2. Headlamp's parseKubeConfig endpoint — so the SPA knows about the cluster
 *     and doesn't redirect to its own login screen.
 *
 * Multi-tenancy: each MCP gets a unique clusterAlias (project--workspace--name).
 * IndexedDB is per-browser so different users are naturally isolated. Stale
 * aliases from previous MCPs accumulate in the sidebar but are harmless — the
 * iframe always navigates directly to /c/<alias> so the list is never shown.
 *
 * The kubeconfig sent to parseKubeConfig is credential-free (server + CA only).
 * The actual bearer token is never exposed to the browser; the BFF injects it.
 *
 * Returns the cluster alias that was registered.
 */
export async function registerKubeconfigWithBff(rawKubeconfig: string, clusterAlias: string): Promise<string> {
  const prepared = prepareKubeconfigForHeadlamp(rawKubeconfig, clusterAlias);
  const base64 = toBase64(prepared);

  // Fire both registrations in parallel — neither depends on the other.
  await Promise.all([
    // Store in BFF session for server-side KUBECONFIG header injection.
    fetch('/api/headlamp-kubeconfig', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kubeconfig: base64 }),
    }),
    // Register with Headlamp's SPA so it doesn't redirect to its login screen.
    // parseKubeConfig stores the cluster in the browser's IndexedDB state.
    // The kubeconfig is credential-free — server URL + CA only, no token.
    fetch('/api/headlamp/parseKubeConfig', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kubeconfigs: [base64] }),
    }),
  ]);

  return clusterAlias;
}
