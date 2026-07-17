import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useComponentCardStatus } from './useComponentCardStatus';

const yamlResult = (overrides: Partial<{ yaml: string | null; isLoading: boolean; error: unknown }> = {}) => ({
  yaml: null,
  isLoading: false,
  error: undefined,
  ...overrides,
});

describe('useComponentCardStatus', () => {
  it('returns uninstalled status when not installed', () => {
    const { result } = renderHook(() => useComponentCardStatus(false, yamlResult({ yaml: null })));

    expect(result.current.status).toEqual({ kind: 'uninstalled' });
    expect(result.current.resource).toBeNull();
  });

  it('reports isLoading while installed and the yaml query has not resolved yet', () => {
    const { result } = renderHook(() => useComponentCardStatus(true, yamlResult({ yaml: null, isLoading: true })));

    expect(result.current.status).toEqual({
      kind: 'installed',
      phase: null,
      conditions: [],
      isLoading: true,
      hasError: false,
    });
  });

  it('reports hasError when the yaml query failed and no resource was ever loaded', () => {
    const { result } = renderHook(() =>
      useComponentCardStatus(true, yamlResult({ yaml: null, error: new Error('network error') })),
    );

    expect(result.current.status).toEqual({
      kind: 'installed',
      phase: null,
      conditions: [],
      isLoading: false,
      hasError: true,
    });
  });

  it('extracts phase and conditions from valid yaml', () => {
    const yaml = `
apiVersion: v1
kind: Crossplane
metadata:
  name: crossplane
status:
  phase: Ready
  conditions:
    - type: Ready
      status: "True"
      reason: Available
      message: All good
      lastTransitionTime: "2026-01-01T00:00:00Z"
`;
    const { result } = renderHook(() => useComponentCardStatus(true, yamlResult({ yaml })));

    expect(result.current.resource).not.toBeNull();
    expect(result.current.status).toEqual({
      kind: 'installed',
      phase: 'Ready',
      conditions: [
        {
          type: 'Ready',
          status: 'True',
          reason: 'Available',
          message: 'All good',
          lastTransitionTime: '2026-01-01T00:00:00Z',
        },
      ],
      isLoading: false,
      hasError: false,
    });
  });

  it('filters out null entries in the conditions array', () => {
    const yaml = `
apiVersion: v1
kind: Crossplane
metadata:
  name: crossplane
status:
  phase: Ready
  conditions:
    - null
    - type: Ready
      status: "True"
      reason: Available
      message: All good
      lastTransitionTime: "2026-01-01T00:00:00Z"
`;
    const { result } = renderHook(() => useComponentCardStatus(true, yamlResult({ yaml })));

    expect(result.current.status.kind).toBe('installed');
    expect(result.current.status.kind === 'installed' && result.current.status.conditions).toHaveLength(1);
  });

  it('returns resource: null when the yaml fails to parse', () => {
    const { result } = renderHook(() =>
      useComponentCardStatus(true, yamlResult({ yaml: '{ unterminated flow mapping' })),
    );

    expect(result.current.resource).toBeNull();
    expect(result.current.status).toEqual({
      kind: 'installed',
      phase: null,
      conditions: [],
      isLoading: false,
      hasError: false,
    });
  });

  it('falls back to null phase and empty conditions when status does not match the expected schema', () => {
    const yaml = `
apiVersion: v1
kind: Crossplane
metadata:
  name: crossplane
status:
  phase: 42
`;
    const { result } = renderHook(() => useComponentCardStatus(true, yamlResult({ yaml })));

    expect(result.current.status).toEqual({
      kind: 'installed',
      phase: null,
      conditions: [],
      isLoading: false,
      hasError: false,
    });
  });
});
