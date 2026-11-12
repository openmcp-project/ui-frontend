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

  it('indexes installed components by control plane name across all six services, capturing phase', () => {
    useQueryMock.mockReturnValue(
      makeQueryResult({
        crossplane_services_open_control_plane_io: {
          v1alpha1: {
            Crossplanes: {
              items: [{ metadata: { name: 'cp-a' }, spec: { version: '1.14.0' }, status: { phase: 'Progressing' } }],
            },
          },
        },
        flux_services_open_control_plane_io: {
          v1alpha1: {
            Fluxes: { items: [{ metadata: { name: 'cp-a' }, spec: { version: '2.3.0' }, status: { phase: 'Ready' } }] },
          },
        },
        ocm_services_open_control_plane_io: {
          v1alpha1: { OCMs: { items: [{ metadata: { name: 'cp-b' }, spec: { version: 'v0.3.0' } }] } },
        },
      }),
    );

    const { result } = renderHook(() => useMcpV2ComponentsListQuery('project-foo--ws-bar'));

    expect(result.current.componentsByName['cp-a']).toEqual({
      crossplane: { phase: 'Progressing', version: '1.14.0', errorMessage: null, reconcilingSince: null },
      flux: { phase: 'Ready', version: '2.3.0', errorMessage: null, reconcilingSince: null },
    });
    // A service with no status reports a null phase (not installed elsewhere).
    expect(result.current.componentsByName['cp-b']).toEqual({
      ocm: { phase: null, version: 'v0.3.0', errorMessage: null, reconcilingSince: null },
    });
    expect(result.current.componentsByName['cp-c']).toBeUndefined();
  });

  it('captures a failing Ready condition as the error message, even while phase is Progressing', () => {
    useQueryMock.mockReturnValue(
      makeQueryResult({
        ocm_services_open_control_plane_io: {
          v1alpha1: {
            OCMs: {
              items: [
                {
                  metadata: { name: 'cp-a' },
                  spec: { version: 'v0.3.0' },
                  status: {
                    phase: 'Progressing',
                    conditions: [
                      {
                        type: 'Ready',
                        status: 'False',
                        reason: 'ReconcileError',
                        message: 'invalid user input: requested version is not available: "v0.3.0"',
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      }),
    );

    const { result } = renderHook(() => useMcpV2ComponentsListQuery('project-foo--ws-bar'));

    expect(result.current.componentsByName['cp-a']).toEqual({
      ocm: {
        phase: 'Progressing',
        version: 'v0.3.0',
        errorMessage: 'invalid user input: requested version is not available: "v0.3.0"',
        reconcilingSince: null,
      },
    });
  });

  it('leaves errorMessage null when the Ready condition is True', () => {
    useQueryMock.mockReturnValue(
      makeQueryResult({
        ocm_services_open_control_plane_io: {
          v1alpha1: {
            OCMs: {
              items: [
                {
                  metadata: { name: 'cp-a' },
                  spec: { version: 'v0.3.0' },
                  status: {
                    phase: 'Ready',
                    conditions: [{ type: 'Ready', status: 'True', reason: 'ReconcileSuccess', message: 'all good' }],
                  },
                },
              ],
            },
          },
        },
      }),
    );

    const { result } = renderHook(() => useMcpV2ComponentsListQuery('project-foo--ws-bar'));

    expect(result.current.componentsByName['cp-a']).toEqual({
      ocm: { phase: 'Ready', version: 'v0.3.0', errorMessage: null, reconcilingSince: null },
    });
  });

  it('treats a benign in-progress Ready: False (reason Reconciling) as installing, not an error', () => {
    useQueryMock.mockReturnValue(
      makeQueryResult({
        ocm_services_open_control_plane_io: {
          v1alpha1: {
            OCMs: {
              items: [
                {
                  metadata: { name: 'cp-a' },
                  spec: { version: 'v0.19.0' },
                  status: {
                    phase: 'Progressing',
                    conditions: [
                      {
                        type: 'Ready',
                        status: 'False',
                        reason: 'Reconciling',
                        message: 'Waiting for managed resources to become ready',
                        lastTransitionTime: '2026-11-12T10:00:00.000Z',
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      }),
    );

    const { result } = renderHook(() => useMcpV2ComponentsListQuery('project-foo--ws-bar'));

    expect(result.current.componentsByName['cp-a']).toEqual({
      ocm: {
        phase: 'Progressing',
        version: 'v0.19.0',
        errorMessage: null,
        reconcilingSince: '2026-11-12T10:00:00.000Z',
      },
    });
  });

  it('detects an error from a non-Ready readiness condition (CrossplaneReady: False, reason Unhealthy)', () => {
    useQueryMock.mockReturnValue(
      makeQueryResult({
        crossplane_services_open_control_plane_io: {
          v1alpha1: {
            Crossplanes: {
              items: [
                {
                  metadata: { name: 'cp-a' },
                  spec: { version: 'v1.20.1-1' },
                  status: {
                    phase: 'Progressing',
                    conditions: [
                      {
                        type: 'CrossplaneReady',
                        status: 'False',
                        reason: 'Unhealthy',
                        message: 'artifact revision v1.20.1-1 does not match chart version 1.20.1',
                        lastTransitionTime: '2026-11-10T16:13:29Z',
                      },
                      {
                        type: 'ProviderHelmReady',
                        status: 'True',
                        reason: 'Healthy',
                        message: 'ProviderHelm is healthy.',
                      },
                      {
                        type: 'Reconciled',
                        status: 'False',
                        reason: 'ComponentReconcileFailed',
                        message: 'Not all components are ready',
                        lastTransitionTime: '2026-11-10T16:13:29Z',
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      }),
    );

    const { result } = renderHook(() => useMcpV2ComponentsListQuery('project-foo--ws-bar'));

    // The first failing condition's message is surfaced; reconcilingSince stays null (it's an error).
    expect(result.current.componentsByName['cp-a']).toEqual({
      crossplane: {
        phase: 'Progressing',
        version: 'v1.20.1-1',
        errorMessage: 'artifact revision v1.20.1-1 does not match chart version 1.20.1',
        reconcilingSince: null,
      },
    });
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
