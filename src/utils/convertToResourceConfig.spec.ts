import { describe, it, expect } from 'vitest';
import { convertToResourceConfig } from './convertToResourceConfig';
import { LAST_APPLIED_CONFIGURATION_ANNOTATION } from '../lib/api/types/shared/keyNames';
import type { Resource } from './removeManagedFieldsAndFilterData';

const baseResource = (): Resource => ({
  apiVersion: 'v1',
  kind: 'ConfigMap',
  metadata: {
    name: 'example',
    namespace: 'demo-ns',
    labels: { app: 'demo' },
    annotations: {
      [LAST_APPLIED_CONFIGURATION_ANNOTATION]: '{"dummy":"config"}',
      'custom/anno': 'keep-me',
    },
    managedFields: [{ manager: 'kube-controller' }],
    creationTimestamp: '2025-01-01T00:00:00Z',
    finalizers: ['protect'],
    generation: 3,
    resourceVersion: '12345',
    uid: 'abcdef',
  },
  spec: { foo: 'bar' },
  status: { observedGeneration: 3 },
});

describe('convertToResourceConfig', () => {
  it('produces a lean manifest without status & server-only metadata', () => {
    const input = baseResource();
    const output = convertToResourceConfig(input);

    // Keep essentials
    expect(output.apiVersion).toEqual('v1');
    expect(output.kind).toEqual('ConfigMap');
    expect(output.metadata.name).toEqual('example');
    expect(output.metadata.namespace).toEqual('demo-ns');
    expect(output.metadata.labels).toEqual({ app: 'demo' });
    expect(output.metadata).not.toHaveProperty('finalizers');
    expect(output.spec).toEqual({ foo: 'bar' });

    // Remove unwanted
    expect(output.metadata).not.toHaveProperty('managedFields');
    expect(output.metadata).not.toHaveProperty('resourceVersion');
    expect(output.metadata).not.toHaveProperty('uid');
    expect(output.metadata).not.toHaveProperty('generation');
    expect(output.metadata).not.toHaveProperty('creationTimestamp');
    // Removed annotation
    expect(output.metadata.annotations?.[LAST_APPLIED_CONFIGURATION_ANNOTATION]).toBeUndefined();
    // Custom annotation kept
    expect(output.metadata.annotations?.['custom/anno']).toEqual('keep-me');
    // Status removed
    expect(output.status).toBeUndefined();
  });

  it('handles list resources recursively', () => {
    const list: Resource = {
      apiVersion: 'v1',
      kind: 'ConfigMapList',
      metadata: { name: 'ignored-list-meta' },
      items: [baseResource(), baseResource()],
    };

    const out = convertToResourceConfig(list);
    expect(out.items).toBeDefined();
    expect(out.items?.length).toEqual(2);
    out.items?.forEach((item) => {
      expect(item.metadata.annotations?.[LAST_APPLIED_CONFIGURATION_ANNOTATION]).toBeUndefined();
      expect(item.metadata.labels).toEqual({ app: 'demo' });
      expect(item.status).toBeUndefined();
    });
  });

  it('returns empty object shape when input is null/undefined', () => {
    const out = convertToResourceConfig(null);
    expect(out).toBeInstanceOf(Object);
  });
});
