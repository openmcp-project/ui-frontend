import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

type KubeEntry = { name: string; [key: string]: unknown };

export function prepareKubeconfigForHeadlamp(rawKubeconfig: string, clusterAlias: string): string {
  let kc: Record<string, unknown>;
  try {
    const parsed = parseYaml(rawKubeconfig);
    if (!parsed || typeof parsed !== 'object') return rawKubeconfig;
    kc = parsed as Record<string, unknown>;
  } catch {
    return rawKubeconfig;
  }

  if (Array.isArray(kc.clusters) && kc.clusters.length > 0) {
    kc.clusters = kc.clusters.slice(0, 1).map((c: KubeEntry) => ({ ...c, name: clusterAlias }));
  }

  kc.users = [{ name: clusterAlias, user: { token: 'bff-managed' } }];

  const firstCtx =
    Array.isArray(kc.contexts) && kc.contexts.length > 0
      ? (kc.contexts[0] as { context?: Record<string, unknown> })
      : undefined;
  kc.contexts = [
    { name: clusterAlias, context: { ...(firstCtx?.context ?? {}), cluster: clusterAlias, user: clusterAlias } },
  ];

  kc['current-context'] = clusterAlias;
  return stringifyYaml(kc);
}

function toBase64(str: string): string {
  return btoa(new TextEncoder().encode(str).reduce((s, b) => s + String.fromCharCode(b), ''));
}

export async function registerKubeconfigWithBff(
  rawKubeconfig: string,
  clusterAlias: string,
  signal?: AbortSignal,
): Promise<string> {
  const base64 = toBase64(prepareKubeconfigForHeadlamp(rawKubeconfig, clusterAlias));
  const json = (body: unknown) => ({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  // Remove all dynamic clusters from headlamp-server so stale aliases don't fire requests on iframe boot.
  const configRes = await fetch('/api/headlamp/config', { signal });
  if (configRes.ok) {
    const { clusters } = (await configRes.json()) as { clusters: { name: string }[] | null };
    await Promise.all(
      (clusters ?? [])
        .filter((c) => c.name !== clusterAlias)
        .map((c) => fetch(`/api/headlamp/cluster/${encodeURIComponent(c.name)}`, { method: 'DELETE', signal })),
    );
  }

  // BFF patches 'bff-managed' → real mcp_accessToken and calls parseKubeConfig server-to-server.
  const bff = await fetch('/api/headlamp-kubeconfig', json({ kubeconfig: base64 }));
  if (!bff.ok) {
    throw new Error(`BFF kubeconfig registration failed: ${bff.status}`);
  }

  return clusterAlias;
}
