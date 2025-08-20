import { describe, it, expect } from 'vitest';
import { getStatusCondition, resolveProviderType, generateColorMap } from './graphUtils';
import { ProviderConfigs } from '../../lib/shared/types';

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
