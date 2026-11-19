import { describe, expect, it } from 'vitest';
import { resolveExistingClusterRoles } from './memberRoles.ts';

describe('resolveExistingClusterRoles', () => {
  const all = ['view', 'crossplane-view'];

  it('never flags anything for v1 (unless a value is passed through)', () => {
    expect(resolveExistingClusterRoles(false, 'ready', all)).toBeUndefined();
    expect(resolveExistingClusterRoles(false, 'ready', all, ['x'])).toEqual(['x']);
  });

  it('is undefined while the lookup is not ready, so nothing is flagged', () => {
    expect(resolveExistingClusterRoles(true, 'unknown', all)).toBeUndefined();
    expect(resolveExistingClusterRoles(true, 'loading', all)).toBeUndefined();
    expect(resolveExistingClusterRoles(true, 'error', all)).toBeUndefined();
  });

  it('uses the lookup list once ready', () => {
    expect(resolveExistingClusterRoles(true, 'ready', all)).toEqual(all);
  });

  it('prefers an explicit value passed from above', () => {
    expect(resolveExistingClusterRoles(true, 'unknown', all, ['from-props'])).toEqual(['from-props']);
    expect(resolveExistingClusterRoles(true, 'ready', all, [])).toEqual([]);
  });
});
