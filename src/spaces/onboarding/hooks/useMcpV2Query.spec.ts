import { NetworkStatus } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMcpV2Query } from './useMcpV2Query';

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

const validMcpItem = {
  kind: 'ManagedControlPlaneV2',
  metadata: {
    name: 'my-mcp',
    namespace: 'project-foo--ws-bar',
    creationTimestamp: '2024-01-01T00:00:00Z',
    annotations: { 'openmcp.cloud/created-by': 'user@example.com' },
  },
  spec: {
    iam: {
      oidc: {
        defaultProvider: {
          roleBindings: [
            {
              roleRefs: [{ kind: 'ClusterRole', name: 'admin', namespace: null }],
              subjects: [{ apiGroup: 'rbac.authorization.k8s.io', kind: 'User', name: 'alice', namespace: null }],
            },
          ],
        },
        extraProviders: [],
      },
      tokens: [],
    },
  },
  status: {
    phase: 'Ready',
    access: JSON.stringify({ key: 'my-key', name: 'my-secret', namespace: 'ns', kubeconfig: 'kubeconfig-content' }),
    observedGeneration: 1,
    conditions: [
      {
        type: 'Ready',
        status: 'True',
        reason: 'ReconcileSuccess',
        message: 'All good',
        lastTransitionTime: '2024-01-02T00:00:00Z',
      },
    ],
  },
};

function makeQueryResult(item: unknown) {
  return {
    ...baseQueryResult,
    data: {
      core_openmcp_cloud: {
        v2alpha1: {
          ManagedControlPlaneV2: item,
        },
      },
    },
  } as ReturnType<typeof useQuery>;
}

describe('useMcpV2Query', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    useQueryMock.mockReturnValue(baseQueryResult);
  });

  it('skips the query when name is undefined', () => {
    renderHook(() => useMcpV2Query(undefined, 'project-foo--ws-bar'));

    expect(useQueryMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }));
  });

  it('skips the query when namespace is undefined', () => {
    renderHook(() => useMcpV2Query('my-mcp', undefined));

    expect(useQueryMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }));
  });

  it('runs the query with the correct variables when both name and namespace are provided', () => {
    renderHook(() => useMcpV2Query('my-mcp', 'project-foo--ws-bar'));

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        variables: { name: 'my-mcp', namespace: 'project-foo--ws-bar' },
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

    const { result } = renderHook(() => useMcpV2Query('my-mcp', 'project-foo--ws-bar'));

    expect(result.current.isPending).toBe(true);
  });

  it('sets isPending to false when the query is ready', () => {
    const { result } = renderHook(() => useMcpV2Query('my-mcp', 'project-foo--ws-bar'));

    expect(result.current.isPending).toBe(false);
  });

  it('returns parsed data when the query responds with a valid item', () => {
    useQueryMock.mockReturnValue(makeQueryResult(validMcpItem));

    const { result } = renderHook(() => useMcpV2Query('my-mcp', 'project-foo--ws-bar'));

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.metadata.name).toBe('my-mcp');
    expect(result.current.data?.metadata.namespace).toBe('project-foo--ws-bar');
    expect(result.current.data?.metadata.annotations).toEqual({
      'openmcp.cloud/created-by': 'user@example.com',
    });
  });

  it('parses spec.iam role bindings correctly', () => {
    useQueryMock.mockReturnValue(makeQueryResult(validMcpItem));

    const { result } = renderHook(() => useMcpV2Query('my-mcp', 'project-foo--ws-bar'));

    const roleBinding = result.current.data?.spec?.iam?.oidc?.defaultProvider?.roleBindings?.[0];
    expect(roleBinding?.roleRefs?.[0]?.name).toBe('admin');
    expect(roleBinding?.subjects?.[0]?.kind).toBe('User');
  });

  it('parses status conditions correctly', () => {
    useQueryMock.mockReturnValue(makeQueryResult(validMcpItem));

    const { result } = renderHook(() => useMcpV2Query('my-mcp', 'project-foo--ws-bar'));

    expect(result.current.data?.status?.conditions).toHaveLength(1);
    expect(result.current.data?.status?.conditions[0].type).toBe('Ready');
    expect(result.current.data?.status?.conditions[0].reason).toBe('ReconcileSuccess');
  });

  it('parses the access field from a JSON string', () => {
    useQueryMock.mockReturnValue(makeQueryResult(validMcpItem));

    const { result } = renderHook(() => useMcpV2Query('my-mcp', 'project-foo--ws-bar'));

    expect(result.current.data?.status?.access).toEqual({
      key: 'my-key',
      name: 'my-secret',
      namespace: 'ns',
      kubeconfig: 'kubeconfig-content',
    });
  });

  it('returns undefined data when rawItem is absent', () => {
    const { result } = renderHook(() => useMcpV2Query('my-mcp', 'project-foo--ws-bar'));

    expect(result.current.data).toBeUndefined();
  });

  it('returns undefined data when the item fails schema validation', () => {
    useQueryMock.mockReturnValue(makeQueryResult({ metadata: null }));

    const { result } = renderHook(() => useMcpV2Query('my-mcp', 'project-foo--ws-bar'));

    expect(result.current.data).toBeUndefined();
  });

  it('forwards the Apollo error from the query result', () => {
    const apolloError = new Error('Network error');
    useQueryMock.mockReturnValue({
      ...baseQueryResult,
      error: apolloError,
    } as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useMcpV2Query('my-mcp', 'project-foo--ws-bar'));

    expect(result.current.error).toBe(apolloError);
  });
});
