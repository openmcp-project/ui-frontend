import { describe, it, expect, vi } from 'vitest';
import { getStatusCondition, resolveProviderTypeFromApiVersion, generateColorMap, buildTreeData } from './graphUtils';
import { ProviderConfigs, ManagedResourceGroup, ManagedResourceItem } from '../../lib/shared/types';

describe('getStatusCondition', () => {
  it('returns the Ready condition when present', () => {
    const ready = { type: 'Ready', status: 'True', lastTransitionTime: '2024-01-01' } as const;
    const result = getStatusCondition([ready, { type: 'Healthy', status: 'False', lastTransitionTime: '2024-01-02' }]);
    expect(result).toEqual(ready);
  });

  it('returns the Healthy condition when Ready is absent', () => {
    const healthy = { type: 'Healthy', status: 'True', lastTransitionTime: '2024-01-01' } as const;
    const result = getStatusCondition([healthy, { type: 'Other', status: 'True', lastTransitionTime: '2024-01-02' }]);
    expect(result).toEqual(healthy);
  });

  it('returns undefined if no relevant condition exists', () => {
    const result = getStatusCondition([{ type: 'Other', status: 'True', lastTransitionTime: '2024-01-01' }] as any);
    expect(result).toBeUndefined();
  });

  it('returns undefined for undefined or empty input', () => {
    expect(getStatusCondition(undefined)).toBeUndefined();
    expect(getStatusCondition([])).toBeUndefined();
  });
});

describe('resolveProviderTypeFromApiVersion', () => {
  it('extracts domain from apiVersion and removes "account." prefix', () => {
    expect(resolveProviderTypeFromApiVersion('account.btp.sap.crossplane.io/v1alpha1')).toBe('btp.sap.crossplane.io');
  });

  it('extracts domain from apiVersion without "account." prefix', () => {
    expect(resolveProviderTypeFromApiVersion('cloudfoundry.crossplane.io/v1alpha1')).toBe('cloudfoundry.crossplane.io');
    expect(resolveProviderTypeFromApiVersion('gardener.crossplane.io/v1beta1')).toBe('gardener.crossplane.io');
    expect(resolveProviderTypeFromApiVersion('kubernetes.crossplane.io/v1')).toBe('kubernetes.crossplane.io');
  });

  it('returns "unknown" for empty apiVersion', () => {
    expect(resolveProviderTypeFromApiVersion('')).toBe('unknown');
  });

  it('handles apiVersion without version part', () => {
    expect(resolveProviderTypeFromApiVersion('btp.sap.crossplane.io')).toBe('btp.sap.crossplane.io');
    expect(resolveProviderTypeFromApiVersion('account.btp.sap.crossplane.io')).toBe('btp.sap.crossplane.io');
  });
});

describe('generateColorMap', () => {
  it('returns a color map for providerConfigName', () => {
    const nodes = [
      { providerConfigName: 'a', providerType: 'x' },
      { providerConfigName: 'b', providerType: 'y' },
    ];
    const colorMap = generateColorMap(nodes as any, 'provider');
    expect(colorMap['a']).toBeDefined();
    expect(colorMap['b']).toBeDefined();
  });

  it('returns a color map for providerType', () => {
    const nodes = [
      { providerConfigName: 'a', providerType: 'x' },
      { providerConfigName: 'b', providerType: 'y' },
    ];
    const colorMap = generateColorMap(nodes as any, 'source');
    expect(colorMap['x']).toBeDefined();
    expect(colorMap['y']).toBeDefined();
  });

  it('returns an empty object for empty input', () => {
    expect(generateColorMap([], 'provider')).toEqual({});
  });
});

describe('buildTreeData', () => {
  const mockOnYamlClick = vi.fn();
  const mockProviderConfigsList: ProviderConfigs[] = [
    {
      provider: 'test-provider',
      items: [{ metadata: { name: 'test-config' }, apiVersion: 'btp/v1' }],
    },
  ] as any;

  it('builds tree data for single item', () => {
    const item: ManagedResourceItem = {
      metadata: { name: 'test-resource' },
      apiVersion: 'v1',
      kind: 'TestKind',
      spec: {
        providerConfigRef: { name: 'test-config' },
        forProvider: {},
      },
      status: { conditions: [{ type: 'Ready', status: 'True', lastTransitionTime: '2024-01-01' }] },
    } as any;

    const managedResources: ManagedResourceGroup[] = [{ items: [item] }];
    const result = buildTreeData(managedResources, mockProviderConfigsList, mockOnYamlClick);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'test-resource-v1',
      label: 'test-resource-v1',
      type: 'TestKind',
      providerConfigName: 'test-config',
      status: 'OK',
      parentId: undefined,
      extraRefs: [],
    });
  });

  it('builds tree data with references', () => {
    const item: ManagedResourceItem = {
      metadata: { name: 'space-resource' },
      apiVersion: 'v1beta1',
      kind: 'Space',
      spec: {
        providerConfigRef: { name: 'cf-config' },
        forProvider: {
          subaccountRef: { name: 'my-subaccount' },
          orgRef: { name: 'my-org' },
        },
      },
      status: { conditions: [{ type: 'Ready', status: 'False' }] },
    } as any;

    const managedResources: ManagedResourceGroup[] = [{ items: [item] }];
    const result = buildTreeData(managedResources, mockProviderConfigsList, mockOnYamlClick);

    expect(result[0]).toMatchObject({
      id: 'space-resource-v1beta1',
      parentId: 'my-subaccount-v1beta1',
      extraRefs: ['my-org-v1beta1'],
      status: 'ERROR',
    });
  });

  it('creates separate nodes for items with same name but different apiVersion', () => {
    const item1: ManagedResourceItem = {
      metadata: { name: 'same-resource' },
      apiVersion: 'v1',
      kind: 'TestKind',
      spec: { providerConfigRef: { name: 'test-config' }, forProvider: {} },
      status: { conditions: [{ type: 'Ready', status: 'True' }] },
    } as any;

    const item2: ManagedResourceItem = {
      metadata: { name: 'same-resource' },
      apiVersion: 'v1beta1',
      kind: 'TestKind',
      spec: { providerConfigRef: { name: 'test-config' }, forProvider: {} },
      status: { conditions: [{ type: 'Ready', status: 'True' }] },
    } as any;

    const managedResources: ManagedResourceGroup[] = [{ items: [item1, item2] }];
    const result = buildTreeData(managedResources, mockProviderConfigsList, mockOnYamlClick);

    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(['same-resource-v1', 'same-resource-v1beta1']);
    expect(result.map((r) => r.label)).toEqual(['same-resource-v1', 'same-resource-v1beta1']);
  });
});
