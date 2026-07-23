import { NetworkStatus } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useKroQuery } from './useKroQuery';

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

function makeQueryResult(raw: unknown) {
  return {
    ...baseQueryResult,
    data: {
      kro_services_open_control_plane_io: {
        v1alpha1: {
          KRO: raw,
        },
      },
    },
  } as ReturnType<typeof useQuery>;
}

const validKro = {
  metadata: { name: 'my-cp', namespace: 'project-foo--ws-bar' },
  spec: { version: 'v0.3.0' },
  status: { conditions: [] },
};

describe('useKroQuery', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    useQueryMock.mockReturnValue(baseQueryResult);
  });

  it('skips the query when name is undefined', () => {
    renderHook(() => useKroQuery(undefined, 'project-foo--ws-bar'));

    expect(useQueryMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }));
  });

  it('skips the query when namespace is undefined', () => {
    renderHook(() => useKroQuery('my-cp', undefined));

    expect(useQueryMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }));
  });

  it('runs the query with correct variables when both name and namespace are provided', () => {
    renderHook(() => useKroQuery('my-cp', 'project-foo--ws-bar'));

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        variables: { name: 'my-cp', namespace: 'project-foo--ws-bar' },
        skip: false,
        notifyOnNetworkStatusChange: true,
      }),
    );
  });

  it('returns null kroData when query has no data', () => {
    const { result } = renderHook(() => useKroQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.kroData).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('returns isInstalled=true and version when KRO resource is present', () => {
    useQueryMock.mockReturnValue(makeQueryResult(validKro));

    const { result } = renderHook(() => useKroQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.kroData?.isInstalled).toBe(true);
    expect(result.current.kroData?.version).toBe('v0.3.0');
  });

  it('returns null kroData when KRO resource is absent (not installed)', () => {
    useQueryMock.mockReturnValue(makeQueryResult(null));

    const { result } = renderHook(() => useKroQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.kroData).toBeNull();
  });

  it('returns null version when spec.version is absent', () => {
    useQueryMock.mockReturnValue(makeQueryResult({ ...validKro, spec: {} }));

    const { result } = renderHook(() => useKroQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.kroData?.version).toBeNull();
  });

  it('sets isLoading to true while loading', () => {
    useQueryMock.mockReturnValue({
      ...baseQueryResult,
      loading: true,
      networkStatus: NetworkStatus.loading,
    } as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useKroQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.isLoading).toBe(true);
  });

  it('forwards the Apollo error from the query result', () => {
    const apolloError = new Error('Network error');
    useQueryMock.mockReturnValue({
      ...baseQueryResult,
      error: apolloError,
    } as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useKroQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.error).toBe(apolloError);
    expect(result.current.kroData).toBeNull();
  });
});
