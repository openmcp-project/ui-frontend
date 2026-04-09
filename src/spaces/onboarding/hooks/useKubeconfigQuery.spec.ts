import { NetworkStatus } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useKubeconfigQuery } from './useKubeconfigQuery';

vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn(),
}));

const useQueryMock = vi.mocked(useQuery);

const baseQueryResult = {
  loading: false,
  networkStatus: NetworkStatus.ready,
  error: undefined,
  data: undefined,
} as ReturnType<typeof useQuery>;

const validKubeconfigData = {
  'ca.crt': 'base64-encoded-ca',
  token: 'base64-encoded-token',
};

function makeQueryResult(data: unknown) {
  return {
    ...baseQueryResult,
    data: {
      v1: {
        Secret: {
          data,
        },
      },
    },
  } as ReturnType<typeof useQuery>;
}

describe('useKubeconfigQuery', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    useQueryMock.mockReturnValue(baseQueryResult);
  });

  it('skips the query when kubeConfigName is undefined', () => {
    renderHook(() => useKubeconfigQuery(undefined, 'some-namespace'));

    expect(useQueryMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }));
  });

  it('skips the query when namespaceName is undefined', () => {
    renderHook(() => useKubeconfigQuery('some-secret', undefined));

    expect(useQueryMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }));
  });

  it('runs the query with the correct variables when both params are provided', () => {
    renderHook(() => useKubeconfigQuery('my-kubeconfig', 'my-namespace'));

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        variables: { kubeConfigName: 'my-kubeconfig', namespaceName: 'my-namespace' },
        skip: false,
        notifyOnNetworkStatusChange: true,
      }),
    );
  });

  it('sets isPending to true while the query is loading', () => {
    useQueryMock.mockReturnValue({
      ...baseQueryResult,
      loading: true,
      networkStatus: NetworkStatus.loading,
    } as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useKubeconfigQuery('my-kubeconfig', 'my-namespace'));

    expect(result.current.isPending).toBe(true);
  });

  it('sets isPending to false when the query is ready', () => {
    const { result } = renderHook(() => useKubeconfigQuery('my-kubeconfig', 'my-namespace'));

    expect(result.current.isPending).toBe(false);
  });

  it('returns parsed data when the query responds with valid kubeconfig data', () => {
    useQueryMock.mockReturnValue(makeQueryResult(validKubeconfigData));

    const { result } = renderHook(() => useKubeconfigQuery('my-kubeconfig', 'my-namespace'));

    expect(result.current.data).toEqual(validKubeconfigData);
  });

  it('returns undefined data when Secret data is absent', () => {
    const { result } = renderHook(() => useKubeconfigQuery('my-kubeconfig', 'my-namespace'));

    expect(result.current.data).toBeUndefined();
  });

  it('returns undefined data when Secret data is null', () => {
    useQueryMock.mockReturnValue(makeQueryResult(null));

    const { result } = renderHook(() => useKubeconfigQuery('my-kubeconfig', 'my-namespace'));

    expect(result.current.data).toBeUndefined();
  });

  it('returns undefined data when the item fails schema validation', () => {
    useQueryMock.mockReturnValue(makeQueryResult({ key: 123 }));

    const { result } = renderHook(() => useKubeconfigQuery('my-kubeconfig', 'my-namespace'));

    expect(result.current.data).toBeUndefined();
  });

  it('forwards the Apollo error from the query result', () => {
    const apolloError = new Error('Network error');
    useQueryMock.mockReturnValue({
      ...baseQueryResult,
      error: apolloError,
    } as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useKubeconfigQuery('my-kubeconfig', 'my-namespace'));

    expect(result.current.error).toBe(apolloError);
  });
});
