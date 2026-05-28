import { NetworkStatus } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFluxQuery } from './useFluxQuery';

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
      flux_services_openmcp_cloud: {
        v1alpha1: {
          Flux: raw,
        },
      },
    },
  } as ReturnType<typeof useQuery>;
}

const validFlux = {
  metadata: { name: 'my-cp', namespace: 'project-foo--ws-bar' },
  spec: { version: '2.3.0' },
  status: { conditions: [] },
};

describe('useFluxQuery', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    useQueryMock.mockReturnValue(baseQueryResult);
  });

  it('skips the query when name is undefined', () => {
    renderHook(() => useFluxQuery(undefined, 'project-foo--ws-bar'));

    expect(useQueryMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }));
  });

  it('skips the query when namespace is undefined', () => {
    renderHook(() => useFluxQuery('my-cp', undefined));

    expect(useQueryMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }));
  });

  it('runs the query with correct variables when both name and namespace are provided', () => {
    renderHook(() => useFluxQuery('my-cp', 'project-foo--ws-bar'));

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        variables: { name: 'my-cp', namespace: 'project-foo--ws-bar' },
        skip: false,
        notifyOnNetworkStatusChange: true,
      }),
    );
  });

  it('returns null fluxData when query has no data', () => {
    const { result } = renderHook(() => useFluxQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.fluxData).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('returns isInstalled=true and version when Flux resource is present', () => {
    useQueryMock.mockReturnValue(makeQueryResult(validFlux));

    const { result } = renderHook(() => useFluxQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.fluxData?.isInstalled).toBe(true);
    expect(result.current.fluxData?.version).toBe('2.3.0');
  });

  it('returns null fluxData when Flux resource is absent (not installed)', () => {
    useQueryMock.mockReturnValue(makeQueryResult(null));

    const { result } = renderHook(() => useFluxQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.fluxData).toBeNull();
  });

  it('returns null version when spec.version is absent', () => {
    useQueryMock.mockReturnValue(makeQueryResult({ ...validFlux, spec: {} }));

    const { result } = renderHook(() => useFluxQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.fluxData?.version).toBeNull();
  });

  it('sets isLoading to true while loading', () => {
    useQueryMock.mockReturnValue({
      ...baseQueryResult,
      loading: true,
      networkStatus: NetworkStatus.loading,
    } as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useFluxQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.isLoading).toBe(true);
  });

  it('forwards the Apollo error from the query result', () => {
    const apolloError = new Error('Network error');
    useQueryMock.mockReturnValue({
      ...baseQueryResult,
      error: apolloError,
    } as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useFluxQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.error).toBe(apolloError);
    expect(result.current.fluxData).toBeNull();
  });
});
