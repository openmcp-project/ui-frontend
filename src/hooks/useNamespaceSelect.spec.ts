import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNamespaceSelect } from './useNamespaceSelect';

let mockNamespaces: { metadata: { name: string } }[] = [];

vi.mock('../lib/api/useApiResource.ts', () => ({
  useApiResource: () => ({
    data: mockNamespaces,
    error: undefined,
    isLoading: false,
  }),
}));

describe('useNamespaceSelect', () => {
  beforeEach(() => {
    mockNamespaces = [];
  });

  it('should default to "default" when it exists', () => {
    mockNamespaces = [{ metadata: { name: 'kube-system' } }, { metadata: { name: 'default' } }];

    const { result } = renderHook(() => useNamespaceSelect());

    expect(result.current.selectedNamespace).toBe('default');
    expect(result.current.namespaces).toEqual(['default', 'kube-system']);
  });

  it('should default to first namespace (sorted) when "default" does not exist', () => {
    mockNamespaces = [{ metadata: { name: 'zzz' } }, { metadata: { name: 'aaa' } }];

    const { result } = renderHook(() => useNamespaceSelect());

    expect(result.current.namespaces).toEqual(['aaa', 'zzz']);
    expect(result.current.selectedNamespace).toBe('aaa');
  });

  it('should update selectedNamespace on onNamespaceChange', () => {
    mockNamespaces = [{ metadata: { name: 'default' } }, { metadata: { name: 'kube-system' } }];

    const { result } = renderHook(() => useNamespaceSelect());

    act(() => {
      result.current.onNamespaceChange({
        detail: { selectedOption: { textContent: 'kube-system' } },
      });
    });

    expect(result.current.selectedNamespace).toBe('kube-system');
  });
});
