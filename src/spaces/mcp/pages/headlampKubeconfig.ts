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

  kc.users = [{ name: clusterAlias, user: {} }];

  if (Array.isArray(kc.contexts) && kc.contexts.length > 0) {
    const firstCtx = kc.contexts[0] as { context?: Record<string, unknown> };
    kc.contexts = [
      { name: clusterAlias, context: { ...(firstCtx.context ?? {}), cluster: clusterAlias, user: clusterAlias } },
    ];
  }

  kc['current-context'] = clusterAlias;
  return stringifyYaml(kc);
}

function toBase64(str: string): string {
  return btoa(new TextEncoder().encode(str).reduce((s, b) => s + String.fromCharCode(b), ''));
}

export async function registerKubeconfigWithBff(rawKubeconfig: string, clusterAlias: string): Promise<string> {
  const base64 = toBase64(prepareKubeconfigForHeadlamp(rawKubeconfig, clusterAlias));
  const json = (body: unknown) => ({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const [bff, headlamp] = await Promise.all([
    fetch('/api/headlamp-kubeconfig', json({ kubeconfig: base64 })),
    fetch('/api/headlamp/parseKubeConfig', json({ kubeconfigs: [base64] })),
  ]);

  if (!bff.ok || !headlamp.ok) {
    throw new Error(`Headlamp registration failed: BFF ${bff.status}, Headlamp ${headlamp.status}`);
  }

  return clusterAlias;
}
