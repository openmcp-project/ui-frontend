import { NetworkStatus } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCrossplaneQuery } from './useCrossplaneQuery';

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
      crossplane_services_openmcp_cloud: {
        v1alpha1: {
          Crossplane: raw,
        },
      },
    },
  } as ReturnType<typeof useQuery>;
}

const validCrossplane = {
  kind: 'Crossplane',
  metadata: { name: 'my-cp', namespace: 'project-foo--ws-bar' },
  spec: {
    version: '1.14.0',
    providers: [
      { name: 'provider-aws', version: '0.40.0' },
      { name: 'provider-gcp', version: '0.35.0' },
    ],
  },
  status: { conditions: [] },
};

describe('useCrossplaneQuery', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    useQueryMock.mockReturnValue(baseQueryResult);
  });

  it('skips the query when name is undefined', () => {
    renderHook(() => useCrossplaneQuery(undefined, 'project-foo--ws-bar'));

    expect(useQueryMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }));
  });

  it('skips the query when namespace is undefined', () => {
    renderHook(() => useCrossplaneQuery('my-cp', undefined));

    expect(useQueryMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }));
  });

  it('runs the query with correct variables when both name and namespace are provided', () => {
    renderHook(() => useCrossplaneQuery('my-cp', 'project-foo--ws-bar'));

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        variables: { name: 'my-cp', namespace: 'project-foo--ws-bar' },
        skip: false,
        notifyOnNetworkStatusChange: true,
      }),
    );
  });

  it('returns null crossplaneData when query has no data', () => {
    const { result } = renderHook(() => useCrossplaneQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.crossplaneData).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('returns isInstalled=true and parsed data when Crossplane resource is present', () => {
    useQueryMock.mockReturnValue(makeQueryResult(validCrossplane));

    const { result } = renderHook(() => useCrossplaneQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.crossplaneData).not.toBeNull();
    expect(result.current.crossplaneData?.isInstalled).toBe(true);
    expect(result.current.crossplaneData?.version).toBe('1.14.0');
    expect(result.current.crossplaneData?.providers).toHaveLength(2);
    expect(result.current.crossplaneData?.providers[0]).toEqual({ name: 'provider-aws', version: '0.40.0' });
  });

  it('returns null crossplaneData when Crossplane resource is absent (not installed)', () => {
    useQueryMock.mockReturnValue(makeQueryResult(null));

    const { result } = renderHook(() => useCrossplaneQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.crossplaneData).toBeNull();
  });

  it('returns empty providers array when spec.providers is absent', () => {
    useQueryMock.mockReturnValue(
      makeQueryResult({ ...validCrossplane, spec: { version: '1.14.0', providers: null } }),
    );

    const { result } = renderHook(() => useCrossplaneQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.crossplaneData?.providers).toEqual([]);
  });

  it('sets isLoading to true while loading', () => {
    useQueryMock.mockReturnValue({
      ...baseQueryResult,
      loading: true,
      networkStatus: NetworkStatus.loading,
    } as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useCrossplaneQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.isLoading).toBe(true);
  });

  it('forwards the Apollo error from the query result', () => {
    const apolloError = new Error('Network error');
    useQueryMock.mockReturnValue({
      ...baseQueryResult,
      error: apolloError,
    } as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useCrossplaneQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.error).toBe(apolloError);
    expect(result.current.crossplaneData).toBeNull();
  });
});
