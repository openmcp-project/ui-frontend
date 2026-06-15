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
    const subaccount: ManagedResourceItem = {
      metadata: { name: 'my-subaccount' },
      apiVersion: 'account.btp.sap.crossplane.io/v1alpha1',
      kind: 'Subaccount',
      spec: { providerConfigRef: { name: 'cf-config' }, forProvider: {} },
      status: { conditions: [] },
    } as any;

    const org: ManagedResourceItem = {
      metadata: { name: 'my-org' },
      apiVersion: 'cloudfoundry.crossplane.io/v1alpha1',
      kind: 'Org',
      spec: { providerConfigRef: { name: 'cf-config' }, forProvider: {} },
      status: { conditions: [] },
    } as any;

    const item: ManagedResourceItem = {
      metadata: { name: 'space-resource' },
      apiVersion: 'cloudfoundry.crossplane.io/v1beta1',
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

    const managedResources: ManagedResourceGroup[] = [{ items: [subaccount, org, item] }];
    const result = buildTreeData(managedResources, mockProviderConfigsList, mockOnYamlClick);

    const space = result.find((r) => r.id === 'space-resource-cloudfoundry.crossplane.io/v1beta1');
    expect(space).toMatchObject({
      parentId: 'my-subaccount-account.btp.sap.crossplane.io/v1alpha1',
      extraRefs: ['my-org-cloudfoundry.crossplane.io/v1alpha1'],
      status: 'ERROR',
    });
  });

  it('resolves cross-apiVersion refs by target kind, not by referencing item apiVersion', () => {
    const subaccount: ManagedResourceItem = {
      metadata: { name: 'my-sub' },
      apiVersion: 'account.btp.sap.crossplane.io/v1alpha1',
      kind: 'Subaccount',
      spec: { providerConfigRef: { name: 'pc' }, forProvider: {} },
      status: { conditions: [] },
    } as any;

    const sm: ManagedResourceItem = {
      metadata: { name: 'my-sub-sm' },
      apiVersion: 'account.btp.sap.crossplane.io/v1beta1',
      kind: 'ServiceManager',
      spec: {
        providerConfigRef: { name: 'pc' },
        forProvider: { subaccountRef: { name: 'my-sub' } },
      },
      status: { conditions: [] },
    } as any;

    const result = buildTreeData([{ items: [subaccount, sm] }], mockProviderConfigsList, mockOnYamlClick);
    const smNode = result.find((r) => r.type === 'ServiceManager');
    expect(smNode?.parentId).toBe('my-sub-account.btp.sap.crossplane.io/v1alpha1');
  });

  it('reads refs from spec root when not under spec.forProvider', () => {
    const subaccount: ManagedResourceItem = {
      metadata: { name: 'sa' },
      apiVersion: 'account.btp.sap.crossplane.io/v1alpha1',
      kind: 'Subaccount',
      spec: { providerConfigRef: { name: 'pc' }, forProvider: {} },
      status: { conditions: [] },
    } as any;

    const cm: ManagedResourceItem = {
      metadata: { name: 'sa-cis' },
      apiVersion: 'account.btp.sap.crossplane.io/v1beta1',
      kind: 'CloudManagement',
      spec: { providerConfigRef: { name: 'pc' }, forProvider: {} },
      status: { conditions: [] },
    } as any;

    const kymaEnv: ManagedResourceItem = {
      metadata: { name: 'sa' },
      apiVersion: 'environment.btp.sap.crossplane.io/v1alpha1',
      kind: 'KymaEnvironment',
      spec: {
        providerConfigRef: { name: 'pc' },
        subaccountRef: { name: 'sa' },
        cloudManagementRef: { name: 'sa-cis' },
        forProvider: {},
      },
      status: { conditions: [] },
    } as any;

    const result = buildTreeData([{ items: [subaccount, cm, kymaEnv] }], mockProviderConfigsList, mockOnYamlClick);
    const env = result.find((r) => r.type === 'KymaEnvironment');
    expect(env?.parentId).toBe('sa-account.btp.sap.crossplane.io/v1alpha1');
    expect(env?.extraRefs).toContain('sa-cis-account.btp.sap.crossplane.io/v1beta1');
  });

  it('links Object resources to KymaEnvironment via providerConfigRef name', () => {
    const kymaEnv: ManagedResourceItem = {
      metadata: { name: 'rt-1' },
      apiVersion: 'environment.btp.sap.crossplane.io/v1alpha1',
      kind: 'KymaEnvironment',
      spec: { providerConfigRef: { name: 'pc' }, forProvider: {} },
      status: { conditions: [] },
    } as any;

    const obj: ManagedResourceItem = {
      metadata: { name: 'rt-1-deployer-cr' },
      apiVersion: 'kubernetes.crossplane.io/v1alpha2',
      kind: 'Object',
      spec: { providerConfigRef: { name: 'rt-1' }, forProvider: {} },
      status: { conditions: [] },
    } as any;

    const result = buildTreeData([{ items: [kymaEnv, obj] }], mockProviderConfigsList, mockOnYamlClick);
    const objNode = result.find((r) => r.type === 'Object');
    expect(objNode?.parentId).toBe('rt-1-environment.btp.sap.crossplane.io/v1alpha1');
  });

  it('links KymaModule to KymaEnvironment via kymaEnvironmentBindingRef', () => {
    const kymaEnv: ManagedResourceItem = {
      metadata: { name: 'rt-1' },
      apiVersion: 'environment.btp.sap.crossplane.io/v1alpha1',
      kind: 'KymaEnvironment',
      spec: { providerConfigRef: { name: 'pc' }, forProvider: {} },
      status: { conditions: [] },
    } as any;

    const mod: ManagedResourceItem = {
      metadata: { name: 'rt-1-deployer' },
      apiVersion: 'environment.btp.sap.crossplane.io/v1alpha1',
      kind: 'KymaModule',
      spec: {
        providerConfigRef: { name: 'pc' },
        kymaEnvironmentBindingRef: { name: 'rt-1' },
        forProvider: {},
      },
      status: { conditions: [] },
    } as any;

    const result = buildTreeData([{ items: [kymaEnv, mod] }], mockProviderConfigsList, mockOnYamlClick);
    const modNode = result.find((r) => r.type === 'KymaModule');
    expect(modNode?.parentId).toBe('rt-1-environment.btp.sap.crossplane.io/v1alpha1');
  });

  it('leaves parentId undefined when ref target is not in the resource list', () => {
    const item: ManagedResourceItem = {
      metadata: { name: 'orphan-sm' },
      apiVersion: 'account.btp.sap.crossplane.io/v1beta1',
      kind: 'ServiceManager',
      spec: {
        providerConfigRef: { name: 'pc' },
        forProvider: { subaccountRef: { name: 'missing-sub' } },
      },
      status: { conditions: [] },
    } as any;

    const result = buildTreeData([{ items: [item] }], mockProviderConfigsList, mockOnYamlClick);
    expect(result[0].parentId).toBeUndefined();
    expect(result[0].extraRefs).toEqual([]);
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
