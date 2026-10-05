import { describe, it, expect } from 'vitest';
import { deduplicateManagedResources, versionRank } from './managedResourceVersion';
import { ManagedResourceItem } from '../lib/shared/types';

const makeItem = (name: string, kind: string, apiVersion: string): ManagedResourceItem =>
  ({
    kind,
    apiVersion,
    metadata: { name, creationTimestamp: '', resourceVersion: '', labels: {} },
  }) as ManagedResourceItem;

describe('versionRank', () => {
  it('ranks stable above beta above alpha', () => {
    expect(versionRank('g/v1')).toBeGreaterThan(versionRank('g/v1beta1'));
    expect(versionRank('g/v1beta1')).toBeGreaterThan(versionRank('g/v1alpha1'));
  });
  it('ranks v2 > v1', () => {
    expect(versionRank('g/v2')).toBeGreaterThan(versionRank('g/v1'));
  });
  it('orders within beta', () => {
    expect(versionRank('g/v2beta3')).toBeGreaterThan(versionRank('g/v1beta9'));
    expect(versionRank('g/v1beta2')).toBeGreaterThan(versionRank('g/v1beta1'));
  });
  it('orders within alpha', () => {
    expect(versionRank('g/v1alpha9')).toBeGreaterThan(versionRank('g/v1alpha1'));
  });
  it('returns 0 for malformed version', () => {
    expect(versionRank('g/junk')).toBe(0);
    expect(versionRank('')).toBe(0);
  });
});

describe('deduplicateManagedResources', () => {
  it('keeps the highest-rank apiVersion per (name, kind)', () => {
    const items = [
      makeItem('bucket', 'Object', 'aws.crossplane.io/v1alpha1'),
      makeItem('bucket', 'Object', 'aws.crossplane.io/v1'),
    ];

    const result = deduplicateManagedResources(items);

    expect(result).toHaveLength(1);
    expect(result[0].apiVersion).toBe('aws.crossplane.io/v1');
  });

  it('keeps the highest-rank version regardless of input order', () => {
    const items = [
      makeItem('bucket', 'Object', 'aws.crossplane.io/v1'),
      makeItem('bucket', 'Object', 'aws.crossplane.io/v1alpha1'),
    ];

    const result = deduplicateManagedResources(items);

    expect(result).toHaveLength(1);
    expect(result[0].apiVersion).toBe('aws.crossplane.io/v1');
  });

  it('does not collapse different kinds sharing a name', () => {
    const items = [
      makeItem('shared', 'Object', 'aws.crossplane.io/v1'),
      makeItem('shared', 'Bucket', 'aws.crossplane.io/v1'),
    ];

    const result = deduplicateManagedResources(items);

    expect(result).toHaveLength(2);
  });

  it('does not collapse the same kind with different names', () => {
    const items = [makeItem('a', 'Object', 'aws.crossplane.io/v1'), makeItem('b', 'Object', 'aws.crossplane.io/v1')];

    expect(deduplicateManagedResources(items)).toHaveLength(2);
  });

  it('skips items missing name or kind', () => {
    const items = [
      makeItem('', 'Object', 'aws.crossplane.io/v1'),
      makeItem('a', '', 'aws.crossplane.io/v1'),
      makeItem('b', 'Object', 'aws.crossplane.io/v1'),
    ];

    const result = deduplicateManagedResources(items);

    expect(result).toHaveLength(1);
    expect(result[0].metadata.name).toBe('b');
  });

  it('returns an empty array for empty input', () => {
    expect(deduplicateManagedResources([])).toEqual([]);
  });
});
