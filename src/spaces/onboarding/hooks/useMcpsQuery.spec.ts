import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NetworkStatus } from '@apollo/client';
import { useQuery, useSubscription } from '@apollo/client/react';
import { useFeatureToggle } from '../../../context/FeatureToggleContext';
import { useMcpsQuery } from './useMcpsQuery';
import { ReadyStatus } from '../types/ControlPlane';

vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn(),
  useSubscription: vi.fn(),
}));

vi.mock('../../../context/FeatureToggleContext', () => ({
  useFeatureToggle: vi.fn(),
}));

const useQueryMock = vi.mocked(useQuery);
const useSubscriptionMock = vi.mocked(useSubscription);
const useFeatureToggleMock = vi.mocked(useFeatureToggle);

const baseQueryResult = {
  loading: false,
  networkStatus: NetworkStatus.ready,
  error: undefined,
  data: undefined,
} as ReturnType<typeof useQuery>;

describe('useMcpsQuery', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    useSubscriptionMock.mockReset();
    useSubscriptionMock.mockReturnValue({} as ReturnType<typeof useSubscription>);
    useFeatureToggleMock.mockReturnValue({
      enableMcpV2: false,
      markMcpV1asDeprecated: false,
      showLandscaperCard: false,
    });
  });

  it('passes namespace as a variable and skips the query when namespace is undefined', () => {
    useQueryMock.mockReturnValue(baseQueryResult);

    renderHook(() => useMcpsQuery(undefined));

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        variables: { workspaceNamespace: '' },
        skip: true,
        notifyOnNetworkStatusChange: true,
      }),
    );
  });

  it('runs the query when namespace is provided', () => {
    useQueryMock.mockReturnValue(baseQueryResult);

    renderHook(() => useMcpsQuery('my-namespace'));

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        variables: { workspaceNamespace: 'my-namespace' },
        skip: false,
      }),
    );
  });

  it('sets isPending to true while the query is loading', () => {
    useQueryMock.mockReturnValue({
      ...baseQueryResult,
      loading: true,
      networkStatus: NetworkStatus.loading,
    } as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useMcpsQuery('my-namespace'));

    expect(result.current.isPending).toBe(true);
  });

  it('maps a v1 ManagedControlPlane to the expected shape', () => {
    useQueryMock.mockReturnValue({
      ...baseQueryResult,
      data: {
        core_openmcp_cloud: {
          v1alpha1: {
            ManagedControlPlanes: {
              items: [
                {
                  metadata: {
                    name: 'mcp-v1',
                    namespace: 'ns-v1',
                    creationTimestamp: '2024-01-01T00:00:00Z',
                    annotations: { 'openmcp.cloud/display-name': 'My MCP' },
                  },
                  status: {
                    status: 'Ready',
                    conditions: [
                      {
                        type: 'Ready',
                        status: 'True',
                        reason: 'AllComponentsHealthy',
                        message: 'All good',
                        lastTransitionTime: '2024-01-01T00:00:00Z',
                      },
                    ],
                    components: {
                      authentication: {
                        access: { key: 'my-key', name: 'my-secret', namespace: 'my-ns' },
                      },
                    },
                  },
                },
              ],
            },
          },
        },
        core_open_control_plane_io: {
          v2alpha1: { ControlPlanes: { items: [] } },
        },
      },
    } as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useMcpsQuery('ns-v1'));
    const mcp = result.current.data[0];

    expect(mcp.version).toBe('v1');
    expect(mcp.metadata).toEqual({
      name: 'mcp-v1',
      namespace: 'ns-v1',
      creationTimestamp: '2024-01-01T00:00:00Z',
      annotations: { 'openmcp.cloud/display-name': 'My MCP' },
    });
    expect(mcp.status?.status).toBe(ReadyStatus.Ready);
    expect(mcp.status?.conditions[0].type).toBe('Ready');
    expect(mcp.status?.access).toEqual({ key: 'my-key', name: 'my-secret', namespace: 'my-ns' });
  });

  it('maps a v2 ManagedControlPlaneV2 to the expected shape when enableMcpV2 is true', () => {
    useFeatureToggleMock.mockReturnValue({
      enableMcpV2: true,
      markMcpV1asDeprecated: false,
      showLandscaperCard: false,
    });
    const accessObj = { key: 'k2', name: 'n2', namespace: 'ns2' };

    useQueryMock.mockReturnValue({
      ...baseQueryResult,
      data: {
        core_openmcp_cloud: {
          v1alpha1: { ManagedControlPlanes: { items: [] } },
        },
        core_open_control_plane_io: {
          v2alpha1: {
            ControlPlanes: {
              items: [
                {
                  metadata: {
                    name: 'mcp-v2',
                    namespace: 'ns-v2',
                    creationTimestamp: '2024-06-01T00:00:00Z',
                    annotations: {},
                  },
                  status: {
                    phase: 'Ready',
                    conditions: [
                      {
                        type: 'Synced',
                        status: 'True',
                        reason: 'ReconcileSuccess',
                        message: '',
                        lastTransitionTime: '2024-06-01T00:00:00Z',
                      },
                    ],
                    access: JSON.stringify(accessObj),
                  },
                },
              ],
            },
          },
        },
      },
    } as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useMcpsQuery('ns-v2'));
    const mcp = result.current.data[0];

    expect(mcp.version).toBe('v2');
    expect(mcp.metadata.name).toBe('mcp-v2');
    expect(mcp.status?.status).toBe(ReadyStatus.Ready);
    expect(mcp.status?.conditions[0].type).toBe('Synced');
    expect(mcp.status?.access).toEqual({ key: 'k2', name: 'n2', namespace: 'ns2' });
  });

  it('excludes v2 items when enableMcpV2 feature flag is off', () => {
    useFeatureToggleMock.mockReturnValue({
      enableMcpV2: false,
      markMcpV1asDeprecated: false,
      showLandscaperCard: false,
    });
    useQueryMock.mockReturnValue({
      ...baseQueryResult,
      data: {
        core_openmcp_cloud: {
          v1alpha1: {
            ManagedControlPlanes: {
              items: [
                {
                  metadata: { name: 'mcp-v1', namespace: 'ns', creationTimestamp: '', annotations: {} },
                  status: null,
                },
              ],
            },
          },
        },
        core_open_control_plane_io: {
          v2alpha1: {
            ControlPlanes: {
              items: [
                {
                  metadata: { name: 'mcp-v2', namespace: 'ns', creationTimestamp: '', annotations: {} },
                  status: null,
                },
              ],
            },
          },
        },
      },
    } as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useMcpsQuery('ns'));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].metadata.name).toBe('mcp-v1');
  });

  it('merges v1 and v2 items when enableMcpV2 feature flag is on', () => {
    useFeatureToggleMock.mockReturnValue({
      enableMcpV2: true,
      markMcpV1asDeprecated: false,
      showLandscaperCard: false,
    });
    useQueryMock.mockReturnValue({
      ...baseQueryResult,
      data: {
        core_openmcp_cloud: {
          v1alpha1: {
            ManagedControlPlanes: {
              items: [
                {
                  metadata: { name: 'mcp-v1', namespace: 'ns', creationTimestamp: '', annotations: {} },
                  status: null,
                },
              ],
            },
          },
        },
        core_open_control_plane_io: {
          v2alpha1: {
            ControlPlanes: {
              items: [
                {
                  metadata: { name: 'mcp-v2', namespace: 'ns', creationTimestamp: '', annotations: {} },
                  status: null,
                },
              ],
            },
          },
        },
      },
    } as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useMcpsQuery('ns'));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data.map((mcp) => mcp.metadata.name)).toEqual(['mcp-v1', 'mcp-v2']);
  });

  it('filters out and warns about malformed items', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    useQueryMock.mockReturnValue({
      ...baseQueryResult,
      data: {
        core_openmcp_cloud: {
          v1alpha1: {
            ManagedControlPlanes: {
              items: [
                { metadata: null, status: null },
                {
                  metadata: { name: 'valid', namespace: 'ns', creationTimestamp: '', annotations: {} },
                  status: null,
                },
              ],
            },
          },
        },
        core_open_control_plane_io: {
          v2alpha1: { ControlPlanes: { items: [] } },
        },
      },
    } as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useMcpsQuery('ns'));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].metadata.name).toBe('valid');
    expect(warnSpy).toHaveBeenCalledWith('Invalid control plane data:', expect.anything(), expect.anything());
    warnSpy.mockRestore();
  });

  it('passes through the Apollo error directly', () => {
    const apolloError = {
      name: 'ApolloError',
      message: 'Something went wrong',
      networkError: null,
    } as unknown as ReturnType<typeof useQuery>['error'];

    useQueryMock.mockReturnValue({
      ...baseQueryResult,
      error: apolloError,
    });

    const { result } = renderHook(() => useMcpsQuery('ns'));

    expect(result.current.error).toBe(apolloError);
    expect(result.current.error?.message).toBe('Something went wrong');
  });

  it('returns an empty array when there is no data', () => {
    useQueryMock.mockReturnValue({ ...baseQueryResult, data: undefined });

    const { result } = renderHook(() => useMcpsQuery('ns'));

    expect(result.current.data).toEqual([]);
  });

  it('returns isReadyForSubscriptions as false before the first query resolves', () => {
    useQueryMock.mockReturnValue({ ...baseQueryResult, data: undefined });

    const { result } = renderHook(() => useMcpsQuery('ns'));

    expect(result.current.isReadyForSubscriptions).toBe(false);
  });

  it('returns isReadyForSubscriptions as true once query data is available', () => {
    useQueryMock.mockReturnValue({
      ...baseQueryResult,
      data: {
        core_openmcp_cloud: { v1alpha1: { ManagedControlPlanes: { items: [] } } },
        core_open_control_plane_io: { v2alpha1: { ControlPlanes: { items: [] } } },
      },
    } as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useMcpsQuery('ns'));

    expect(result.current.isReadyForSubscriptions).toBe(true);
  });

  it('refetches when the v1 subscription receives an event', () => {
    vi.useFakeTimers();
    const refetch = vi.fn();
    useQueryMock.mockReturnValue({
      ...baseQueryResult,
      data: {
        core_openmcp_cloud: { v1alpha1: { ManagedControlPlanes: { items: [] } } },
        core_open_control_plane_io: { v2alpha1: { ControlPlanes: { items: [] } } },
      },
      refetch,
    } as unknown as ReturnType<typeof useQuery>);
    useSubscriptionMock
      .mockReturnValueOnce({
        data: { core_openmcp_cloud_v1alpha1_managedcontrolplanes: { type: 'MODIFIED' } },
      } as ReturnType<typeof useSubscription>)
      .mockReturnValueOnce({} as ReturnType<typeof useSubscription>);

    renderHook(() => useMcpsQuery('ns'));
    vi.runAllTimers();
    vi.useRealTimers();

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('refetches when the v2 subscription receives an event', () => {
    vi.useFakeTimers();
    useFeatureToggleMock.mockReturnValue({
      enableMcpV2: true,
      markMcpV1asDeprecated: false,
      showLandscaperCard: false,
    });
    const refetch = vi.fn();
    useQueryMock.mockReturnValue({
      ...baseQueryResult,
      data: {
        core_openmcp_cloud: { v1alpha1: { ManagedControlPlanes: { items: [] } } },
        core_open_control_plane_io: { v2alpha1: { ControlPlanes: { items: [] } } },
      },
      refetch,
    } as unknown as ReturnType<typeof useQuery>);
    useSubscriptionMock.mockReturnValueOnce({} as ReturnType<typeof useSubscription>).mockReturnValueOnce({
      data: { core_open_control_plane_io_v2alpha1_controlplanes: { type: 'ADDED' } },
    } as ReturnType<typeof useSubscription>);

    renderHook(() => useMcpsQuery('ns'));
    vi.runAllTimers();
    vi.useRealTimers();

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('coalesces simultaneous v1 and v2 subscription events into a single refetch', () => {
    vi.useFakeTimers();
    useFeatureToggleMock.mockReturnValue({
      enableMcpV2: true,
      markMcpV1asDeprecated: false,
      showLandscaperCard: false,
    });
    const refetch = vi.fn();
    useQueryMock.mockReturnValue({
      ...baseQueryResult,
      data: {
        core_openmcp_cloud: { v1alpha1: { ManagedControlPlanes: { items: [] } } },
        core_open_control_plane_io: { v2alpha1: { ControlPlanes: { items: [] } } },
      },
      refetch,
    } as unknown as ReturnType<typeof useQuery>);
    useSubscriptionMock
      .mockReturnValueOnce({
        data: { core_openmcp_cloud_v1alpha1_managedcontrolplanes: { type: 'MODIFIED' } },
      } as ReturnType<typeof useSubscription>)
      .mockReturnValueOnce({
        data: { core_open_control_plane_io_v2alpha1_controlplanes: { type: 'MODIFIED' } },
      } as ReturnType<typeof useSubscription>);

    renderHook(() => useMcpsQuery('ns'));
    vi.runAllTimers();
    vi.useRealTimers();

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('returns data from the names query in minimal mode', () => {
    useQueryMock.mockReturnValueOnce(baseQueryResult).mockReturnValueOnce({
      ...baseQueryResult,
      data: {
        core_openmcp_cloud: {
          v1alpha1: {
            ManagedControlPlanes: {
              items: [{ metadata: { name: 'mcp-1', namespace: 'ns', annotations: {} } }],
            },
          },
        },
        core_open_control_plane_io: { v2alpha1: { ControlPlanes: { items: [] } } },
      },
    } as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useMcpsQuery('ns', { mode: 'minimal' }));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].metadata.name).toBe('mcp-1');
  });

  it('surfaces namesResult error in minimal mode', () => {
    const namesError = {
      name: 'ApolloError',
      message: 'Names query failed',
      networkError: null,
    } as unknown as ReturnType<typeof useQuery>['error'];
    useQueryMock
      .mockReturnValueOnce(baseQueryResult)
      .mockReturnValueOnce({ ...baseQueryResult, error: namesError } as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useMcpsQuery('ns', { mode: 'minimal' }));

    expect(result.current.error?.message).toBe('Names query failed');
  });
});
