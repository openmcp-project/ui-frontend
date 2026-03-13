import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NetworkStatus } from '@apollo/client';
import { useQuery, useSubscription } from '@apollo/client/react';
import { useWorkspacesQuery } from './useCreateWorkspace';

vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn(),
  useSubscription: vi.fn(),
}));

const useQueryMock = vi.mocked(useQuery);
const useSubscriptionMock = vi.mocked(useSubscription);

describe('useWorkspacesQuery', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    useSubscriptionMock.mockReset();
    useSubscriptionMock.mockReturnValue({} as ReturnType<typeof useSubscription>);
  });

  it('maps workspaces and applies defaults', () => {
    useQueryMock.mockReturnValue({
      data: {
        core_openmcp_cloud: {
          v1alpha1: {
            Workspaces: {
              items: [
                {
                  metadata: {
                    name: 'ws-a',
                    namespace: 'project-demo--ws-ws-a',
                  },
                  spec: {},
                  status: null,
                },
              ],
            },
          },
        },
      },
      loading: false,
      networkStatus: NetworkStatus.ready,
      error: undefined,
    } as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useWorkspacesQuery('demo'));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].metadata.name).toBe('ws-a');
    expect(result.current.data[0].metadata.annotations).toEqual({});
    expect(result.current.data[0].spec.members).toEqual([]);
    expect(result.current.isPending).toBe(false);

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        variables: { projectNamespace: 'project-demo' },
        skip: false,
        notifyOnNetworkStatusChange: true,
      }),
    );

    expect(useSubscriptionMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        skip: false,
      }),
    );
  });

  it('sets isPending only for initial loading', () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      loading: true,
      networkStatus: NetworkStatus.loading,
      error: undefined,
    } as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useWorkspacesQuery('demo'));

    expect(result.current.isPending).toBe(true);
  });

  it('skips query when projectName is missing', () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      loading: false,
      networkStatus: NetworkStatus.ready,
      error: undefined,
    } as ReturnType<typeof useQuery>);

    renderHook(() => useWorkspacesQuery(undefined));

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        variables: { projectNamespace: '' },
        skip: true,
      }),
    );

    expect(useSubscriptionMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        skip: true,
      }),
    );
  });

  it('refetches query when subscription receives data', () => {
    const refetch = vi.fn();
    useQueryMock.mockReturnValue({
      data: undefined,
      loading: false,
      networkStatus: NetworkStatus.ready,
      error: undefined,
      refetch,
    } as unknown as ReturnType<typeof useQuery>);

    useSubscriptionMock.mockReturnValue({
      data: { core_openmcp_cloud_v1alpha1_workspaces: { type: 'MODIFIED' } },
    } as ReturnType<typeof useSubscription>);

    renderHook(() => useWorkspacesQuery('demo'));

    expect(refetch).toHaveBeenCalled();
  });
});
