import { ManagedResourceItem } from '../lib/shared/types';

export function versionRank(apiVersion: string): number {
  const v = apiVersion.split('/')[1] ?? '';
  if (/^v\d+$/.test(v)) return 1000 + parseInt(v.slice(1), 10);
  const m = v.match(/^v(\d+)beta(\d+)$/);
  if (m) return 500 + parseInt(m[1], 10) * 10 + parseInt(m[2], 10);
  const a = v.match(/^v(\d+)alpha(\d+)$/);
  if (a) return 100 + parseInt(a[1], 10) * 10 + parseInt(a[2], 10);
  return 0;
}

// The Kubernetes API serves the same stored object under every registered
// version, so a `/managed` response can list the same resource once per
// apiVersion. Keep only the highest-rank version per (name, kind) — the same
// rule the graph applies in Graph.model.ts (buildIndex) — so table and graph
// agree on which single item represents the resource.
export function deduplicateManagedResources(items: ManagedResourceItem[]): ManagedResourceItem[] {
  const bestByKey = new Map<string, ManagedResourceItem>();

  for (const item of items) {
    const name = item?.metadata?.name;
    const kind = item?.kind;
    if (!name || !kind) continue;

    const key = `${name}::${kind}`;
    const existing = bestByKey.get(key);
    if (!existing || versionRank(item.apiVersion ?? '') > versionRank(existing.apiVersion ?? '')) {
      bestByKey.set(key, item);
    }
  }

  return [...bestByKey.values()];
}
