import type { TypedDocumentNode } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useYamlQuery } from './useYamlQuery';

vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn(),
}));

const useQueryMock = vi.mocked(useQuery);

interface FakeData {
  field: string | null;
}

const FAKE_DOCUMENT = {} as TypedDocumentNode<FakeData, { name: string; namespace?: string | null }>;
const selectYaml = (data: FakeData) => data.field;

const baseQueryResult = {
  loading: false,
  error: undefined,
  data: undefined,
} as ReturnType<typeof useQuery>;

function makeQueryResult(field: string | null) {
  return { ...baseQueryResult, data: { field } } as ReturnType<typeof useQuery>;
}

describe('useYamlQuery', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    useQueryMock.mockReturnValue(baseQueryResult);
  });

  it('skips the query when name is empty', () => {
    renderHook(() => useYamlQuery(FAKE_DOCUMENT, selectYaml, '', 'project-foo--ws-bar'));

    expect(useQueryMock).toHaveBeenCalledWith(FAKE_DOCUMENT, expect.objectContaining({ skip: true }));
  });

  it('skips the query when namespace is empty', () => {
    renderHook(() => useYamlQuery(FAKE_DOCUMENT, selectYaml, 'my-cp', ''));

    expect(useQueryMock).toHaveBeenCalledWith(FAKE_DOCUMENT, expect.objectContaining({ skip: true }));
  });

  it('skips the query when the explicit skip flag is set, even with valid name/namespace', () => {
    renderHook(() => useYamlQuery(FAKE_DOCUMENT, selectYaml, 'my-cp', 'project-foo--ws-bar', true));

    expect(useQueryMock).toHaveBeenCalledWith(FAKE_DOCUMENT, expect.objectContaining({ skip: true }));
  });

  it('runs the query with correct variables, network-only fetch policy, and 30s poll interval', () => {
    renderHook(() => useYamlQuery(FAKE_DOCUMENT, selectYaml, 'my-cp', 'project-foo--ws-bar'));

    expect(useQueryMock).toHaveBeenCalledWith(
      FAKE_DOCUMENT,
      expect.objectContaining({
        variables: { name: 'my-cp', namespace: 'project-foo--ws-bar' },
        skip: false,
        fetchPolicy: 'network-only',
        pollInterval: 30_000,
      }),
    );
  });

  it('returns null yaml when query has no data', () => {
    const { result } = renderHook(() => useYamlQuery(FAKE_DOCUMENT, selectYaml, 'my-cp', 'project-foo--ws-bar'));

    expect(result.current.yaml).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('returns null yaml when selectYaml returns null/undefined despite data being present', () => {
    useQueryMock.mockReturnValue(makeQueryResult(null));

    const { result } = renderHook(() => useYamlQuery(FAKE_DOCUMENT, selectYaml, 'my-cp', 'project-foo--ws-bar'));

    expect(result.current.yaml).toBeNull();
  });

  it('extracts the yaml string via selectYaml on success', () => {
    useQueryMock.mockReturnValue(makeQueryResult('apiVersion: v1\nkind: Crossplane\n'));

    const { result } = renderHook(() => useYamlQuery(FAKE_DOCUMENT, selectYaml, 'my-cp', 'project-foo--ws-bar'));

    expect(result.current.yaml).toBe('apiVersion: v1\nkind: Crossplane\n');
  });

  it('sets isLoading to true while loading', () => {
    useQueryMock.mockReturnValue({ ...baseQueryResult, loading: true } as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useYamlQuery(FAKE_DOCUMENT, selectYaml, 'my-cp', 'project-foo--ws-bar'));

    expect(result.current.isLoading).toBe(true);
  });

  it('forwards the Apollo error from the query result', () => {
    const apolloError = new Error('Network error');
    useQueryMock.mockReturnValue({ ...baseQueryResult, error: apolloError } as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useYamlQuery(FAKE_DOCUMENT, selectYaml, 'my-cp', 'project-foo--ws-bar'));

    expect(result.current.error).toBe(apolloError);
    expect(result.current.yaml).toBeNull();
  });

  it('forwards the refetch function from the query result', () => {
    const refetch = vi.fn();
    useQueryMock.mockReturnValue({ ...baseQueryResult, refetch } as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useYamlQuery(FAKE_DOCUMENT, selectYaml, 'my-cp', 'project-foo--ws-bar'));

    expect(result.current.refetch).toBe(refetch);
  });
});
