import { describe, it, expect } from 'vitest';
import { getStatusFromConditions, resolveProviderType, generateColorMap } from './graphUtils';

describe('getStatusFromConditions', () => {
  it('returns OK if Ready is True', () => {
    expect(getStatusFromConditions([{ type: 'Ready', status: 'True', lastTransitionTime: '2024-01-01' }])).toBe('OK');
  });

  it('returns OK if Healthy is True', () => {
    expect(getStatusFromConditions([{ type: 'Healthy', status: 'True', lastTransitionTime: '2024-01-01' }])).toBe('OK');
  });

  it('returns ERROR if Ready is False', () => {
    expect(getStatusFromConditions([{ type: 'Ready', status: 'False', lastTransitionTime: '2024-01-01' }])).toBe(
      'ERROR',
    );
  });

  it('returns ERROR if Healthy is False', () => {
    expect(getStatusFromConditions([{ type: 'Healthy', status: 'False', lastTransitionTime: '2024-01-01' }])).toBe(
      'ERROR',
    );
  });

  it('returns ERROR if no relevant condition exists', () => {
    expect(getStatusFromConditions([{ type: 'Other', status: 'True', lastTransitionTime: '2024-01-01' }])).toBe(
      'ERROR',
    );
  });

  it('returns ERROR for undefined or empty input', () => {
    expect(getStatusFromConditions(undefined)).toBe('ERROR');
    expect(getStatusFromConditions([])).toBe('ERROR');
  });
});

describe('resolveProviderType', () => {
  it('returns correct providerType if found', () => {
    const configs = [
      {
        items: [
          { metadata: { name: 'foo' }, apiVersion: 'btp/v1' },
          { metadata: { name: 'bar' }, apiVersion: 'cloudfoundry/v1' },
        ],
      },
      {
        items: [{ metadata: { name: 'baz' }, apiVersion: 'gardener/v1' }],
      },
    ];
    expect(resolveProviderType('foo', configs)).toBe('provider-btp');
    expect(resolveProviderType('bar', configs)).toBe('provider-cf');
    expect(resolveProviderType('baz', configs)).toBe('provider-gardener');
  });

  it('returns apiVersion or configName if no match for known providers', () => {
    const configs = [
      {
        items: [{ metadata: { name: 'other' }, apiVersion: 'custom/v1' }],
      },
    ];
    expect(resolveProviderType('other', configs)).toBe('custom/v1');
  });

  it('returns configName if not found', () => {
    const configs = [{ items: [{ metadata: { name: 'foo' }, apiVersion: 'btp/v1' }] }];
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
