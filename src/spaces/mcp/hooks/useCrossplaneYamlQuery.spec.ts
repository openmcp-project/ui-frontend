import { useQuery } from '@apollo/client/react';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCrossplaneYamlQuery } from './useCrossplaneYamlQuery';

vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn(),
}));

const useQueryMock = vi.mocked(useQuery);

const baseQueryResult = {
  loading: false,
  error: undefined,
  data: undefined,
} as ReturnType<typeof useQuery>;

function makeQueryResult(yaml: string | null) {
  return {
    ...baseQueryResult,
    data: {
      crossplane_services_open_control_plane_io: {
        v1alpha1: {
          CrossplaneYaml: yaml,
        },
      },
    },
  } as ReturnType<typeof useQuery>;
}

describe('useCrossplaneYamlQuery', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    useQueryMock.mockReturnValue(baseQueryResult);
  });

  it('skips the query when name is empty', () => {
    renderHook(() => useCrossplaneYamlQuery('', 'project-foo--ws-bar'));

    expect(useQueryMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }));
  });

  it('skips the query when namespace is empty', () => {
    renderHook(() => useCrossplaneYamlQuery('my-cp', ''));

    expect(useQueryMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }));
  });

  it('skips the query when the explicit skip flag is set, even with valid name/namespace', () => {
    renderHook(() => useCrossplaneYamlQuery('my-cp', 'project-foo--ws-bar', true));

    expect(useQueryMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }));
  });

  it('runs the query with correct variables and network-only fetch policy', () => {
    renderHook(() => useCrossplaneYamlQuery('my-cp', 'project-foo--ws-bar'));

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        variables: { name: 'my-cp', namespace: 'project-foo--ws-bar' },
        skip: false,
        fetchPolicy: 'network-only',
      }),
    );
  });

  it('returns null yaml when query has no data', () => {
    const { result } = renderHook(() => useCrossplaneYamlQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.yaml).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('returns the yaml string on success', () => {
    useQueryMock.mockReturnValue(makeQueryResult('apiVersion: v1\nkind: Crossplane\n'));

    const { result } = renderHook(() => useCrossplaneYamlQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.yaml).toBe('apiVersion: v1\nkind: Crossplane\n');
  });

  it('sets isLoading to true while loading', () => {
    useQueryMock.mockReturnValue({ ...baseQueryResult, loading: true } as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useCrossplaneYamlQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.isLoading).toBe(true);
  });

  it('forwards the Apollo error from the query result', () => {
    const apolloError = new Error('Network error');
    useQueryMock.mockReturnValue({ ...baseQueryResult, error: apolloError } as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useCrossplaneYamlQuery('my-cp', 'project-foo--ws-bar'));

    expect(result.current.error).toBe(apolloError);
    expect(result.current.yaml).toBeNull();
  });
});
