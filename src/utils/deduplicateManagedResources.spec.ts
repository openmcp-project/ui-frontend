import { describe, it, expect } from 'vitest';
import { deduplicateManagedResources } from './deduplicateManagedResources';
import { ManagedResourceItem } from '../lib/shared/types';

describe('deduplicateManagedResources', () => {
  const makeItem = (name: string, kind: string, apiVersion: string): ManagedResourceItem =>
    ({
      kind,
      metadata: { name, creationTimestamp: '2024-01-01T00:00:00Z', resourceVersion: '1', labels: {} },
      apiVersion,
      spec: { forProvider: {} },
      status: { conditions: [] },
    }) as unknown as ManagedResourceItem;

  it('keeps single items unchanged', () => {
    const items = [makeItem('res-a', 'CloudManagement', 'account.btp.sap.crossplane.io/v1beta1')];
    const result = deduplicateManagedResources(items);
    expect(result).toHaveLength(1);
    expect(result[0].metadata.name).toBe('res-a');
  });

  it('keeps the higher apiVersion (v1beta1 > v1alpha1)', () => {
    const items = [
      makeItem('cloud-mgmt', 'CloudManagement', 'account.btp.sap.crossplane.io/v1alpha1'),
      makeItem('cloud-mgmt', 'CloudManagement', 'account.btp.sap.crossplane.io/v1beta1'),
    ];
    const result = deduplicateManagedResources(items);
    expect(result).toHaveLength(1);
    expect(result[0].apiVersion).toBe('account.btp.sap.crossplane.io/v1beta1');
  });

  it('keeps the higher apiVersion regardless of input order', () => {
    const items = [
      makeItem('cloud-mgmt', 'CloudManagement', 'account.btp.sap.crossplane.io/v1beta1'),
      makeItem('cloud-mgmt', 'CloudManagement', 'account.btp.sap.crossplane.io/v1alpha1'),
    ];
    const result = deduplicateManagedResources(items);
    expect(result).toHaveLength(1);
    expect(result[0].apiVersion).toBe('account.btp.sap.crossplane.io/v1beta1');
  });

  it('keeps items with same name but different kind', () => {
    const items = [
      makeItem('same-name', 'CloudManagement', 'account.btp.sap.crossplane.io/v1beta1'),
      makeItem('same-name', 'ServiceManager', 'account.btp.sap.crossplane.io/v1beta1'),
    ];
    const result = deduplicateManagedResources(items);
    expect(result).toHaveLength(2);
  });

  it('picks stable over beta over alpha', () => {
    const items = [
      makeItem('res', 'Foo', 'x/v1alpha1'),
      makeItem('res', 'Foo', 'x/v1'),
      makeItem('res', 'Foo', 'x/v1beta1'),
    ];
    const result = deduplicateManagedResources(items);
    expect(result).toHaveLength(1);
    expect(result[0].apiVersion).toBe('x/v1');
  });

  it('picks higher major version', () => {
    const items = [makeItem('res', 'Foo', 'x/v1'), makeItem('res', 'Foo', 'x/v2beta1')];
    const result = deduplicateManagedResources(items);
    expect(result).toHaveLength(1);
    expect(result[0].apiVersion).toBe('x/v2beta1');
  });

  it('returns empty array for empty input', () => {
    expect(deduplicateManagedResources([])).toEqual([]);
  });
});
