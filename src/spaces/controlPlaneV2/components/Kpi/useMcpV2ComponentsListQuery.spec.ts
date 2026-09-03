import { useQuery } from '@apollo/client/react';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMcpV2ComponentsListQuery } from './useMcpV2ComponentsListQuery.ts';

vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn(),
}));

const useQueryMock = vi.mocked(useQuery);

const baseQueryResult = {
  loading: false,
  error: undefined,
  data: undefined,
} as ReturnType<typeof useQuery>;

function makeQueryResult(overrides: Record<string, unknown>) {
  return {
    ...baseQueryResult,
    data: {
      crossplane_services_open_control_plane_io: { v1alpha1: { Crossplanes: { items: [] } } },
      flux_services_open_control_plane_io: { v1alpha1: { Fluxes: { items: [] } } },
      landscaper_services_open_control_plane_io: { v1alpha2: { Landscapers: { items: [] } } },
      external_secrets_services_open_control_plane_io: { v1alpha1: { ExternalSecretsOperators: { items: [] } } },
      ocm_services_open_control_plane_io: { v1alpha1: { OCMs: { items: [] } } },
      kro_services_open_control_plane_io: { v1alpha1: { Kroes: { items: [] } } },
      ...overrides,
    },
  } as unknown as ReturnType<typeof useQuery>;
}

describe('useMcpV2ComponentsListQuery', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    useQueryMock.mockReturnValue(baseQueryResult);
  });

  it('skips the query when namespace is undefined', () => {
    renderHook(() => useMcpV2ComponentsListQuery(undefined));

    expect(useQueryMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }));
  });

  it('skips the query when skip=true even with a namespace', () => {
    renderHook(() => useMcpV2ComponentsListQuery('project-foo--ws-bar', true));

    expect(useQueryMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }));
  });

  it('runs the query with the namespace variable when not skipped', () => {
    renderHook(() => useMcpV2ComponentsListQuery('project-foo--ws-bar'));

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        variables: { namespace: 'project-foo--ws-bar' },
        skip: false,
        notifyOnNetworkStatusChange: true,
      }),
    );
  });

  it('returns an empty index when every list is empty', () => {
    useQueryMock.mockReturnValue(makeQueryResult({}));

    const { result } = renderHook(() => useMcpV2ComponentsListQuery('project-foo--ws-bar'));

    expect(result.current.componentsByName).toEqual({});
    expect(result.current.isLoading).toBe(false);
  });

  it('indexes installed components by control plane name across all six services', () => {
    useQueryMock.mockReturnValue(
      makeQueryResult({
        crossplane_services_open_control_plane_io: {
          v1alpha1: { Crossplanes: { items: [{ metadata: { name: 'cp-a' }, spec: { version: '1.14.0' } }] } },
        },
        flux_services_open_control_plane_io: {
          v1alpha1: { Fluxes: { items: [{ metadata: { name: 'cp-a' }, spec: { version: '2.3.0' } }] } },
        },
        ocm_services_open_control_plane_io: {
          v1alpha1: { OCMs: { items: [{ metadata: { name: 'cp-b' }, spec: { version: 'v0.3.0' } }] } },
        },
      }),
    );

    const { result } = renderHook(() => useMcpV2ComponentsListQuery('project-foo--ws-bar'));

    expect(result.current.componentsByName['cp-a']).toEqual({ crossplane: true, flux: true });
    expect(result.current.componentsByName['cp-b']).toEqual({ ocm: true });
    expect(result.current.componentsByName['cp-c']).toBeUndefined();
  });

  it('ignores items with no version (not actually installed) and items with no name', () => {
    useQueryMock.mockReturnValue(
      makeQueryResult({
        crossplane_services_open_control_plane_io: {
          v1alpha1: {
            Crossplanes: {
              items: [
                { metadata: { name: 'cp-a' }, spec: { version: null } },
                { metadata: { name: null }, spec: { version: '1.14.0' } },
              ],
            },
          },
        },
      }),
    );

    const { result } = renderHook(() => useMcpV2ComponentsListQuery('project-foo--ws-bar'));

    expect(result.current.componentsByName).toEqual({});
  });

  it('forwards the loading and error state from Apollo', () => {
    const apolloError = new Error('Network error');
    useQueryMock.mockReturnValue({ ...baseQueryResult, loading: true, error: apolloError } as ReturnType<
      typeof useQuery
    >);

    const { result } = renderHook(() => useMcpV2ComponentsListQuery('project-foo--ws-bar'));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(apolloError);
  });
});
