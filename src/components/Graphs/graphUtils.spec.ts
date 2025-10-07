import { describe, it, expect, vi } from 'vitest';
import { getStatusCondition, resolveProviderType, generateColorMap, buildTreeData } from './graphUtils';
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

describe('resolveProviderType', () => {
  it('returns correct providerType if found', () => {
    const configs: ProviderConfigs[] = [
      {
        provider: 'provider-a',
        items: [
          { metadata: { name: 'foo' }, apiVersion: 'btp/v1' },
          { metadata: { name: 'bar' }, apiVersion: 'cloudfoundry/v1' },
        ],
      },
      {
        provider: 'provider-b',
        items: [{ metadata: { name: 'baz' }, apiVersion: 'gardener/v1' }],
      },
    ] as any;
    expect(resolveProviderType('foo', configs)).toBe('provider-btp');
    expect(resolveProviderType('bar', configs)).toBe('provider-cf');
    expect(resolveProviderType('baz', configs)).toBe('provider-gardener');
  });

  it('returns apiVersion or configName if no match for known providers', () => {
    const configs: ProviderConfigs[] = [
      {
        provider: 'provider-a',
        items: [{ metadata: { name: 'other' }, apiVersion: 'custom/v1' }],
      },
    ] as any;
    expect(resolveProviderType('other', configs)).toBe('custom/v1');
  });

  it('returns configName if not found', () => {
    const configs: ProviderConfigs[] = [
      { provider: 'provider-a', items: [{ metadata: { name: 'foo' }, apiVersion: 'btp/v1' }] },
    ] as any;
    expect(resolveProviderType('notfound', configs)).toBe('notfound');
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
