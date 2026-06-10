import { ManagedResourceItem } from '../lib/shared/types';

/**
 * Compares two Kubernetes API version strings.
 * Returns > 0 if `a` is higher priority than `b`.
 *
 * Priority: v2 > v1, stable > beta > alpha, beta2 > beta1.
 * https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definition-versioning/#version-priority
 */
function compareApiVersions(a: string | undefined, b: string | undefined): number {
  const parse = (v: string | undefined) => {
    const match = (v?.split('/').pop() ?? '').match(/^v(\d+)(?:(alpha|beta)(\d+)?)?$/);
    if (!match) return { major: 0, rank: -1, sub: 0 };
    const rank = match[2] === 'alpha' ? 0 : match[2] === 'beta' ? 1 : 2;
    return { major: +match[1], rank, sub: +(match[3] ?? 0) };
  };

  const pa = parse(a);
  const pb = parse(b);
  return pa.major - pb.major || pa.rank - pb.rank || pa.sub - pb.sub;
}

/**
 * Deduplicates managed resource items that represent the same resource served
 * under multiple API versions (Crossplane multi-version serving).
 * Keeps the item with the highest API version per name+kind.
 */
export function deduplicateManagedResources(items: ManagedResourceItem[]): ManagedResourceItem[] {
  const seen = new Map<string, ManagedResourceItem>();

  for (const item of items) {
    const key = `${item.kind}:${item.metadata.name}`;
    const existing = seen.get(key);

    if (!existing || compareApiVersions(item.apiVersion, existing.apiVersion) > 0) {
      seen.set(key, item);
    }
  }

  return Array.from(seen.values());
}
