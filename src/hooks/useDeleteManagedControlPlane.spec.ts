import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach, Mock } from 'vitest';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { fetchApiServerJson } from '../lib/api/fetch.ts';
import { useDeleteManagedControlPlane } from './useDeleteManagedControlPlane.ts';

vi.mock('../lib/api/fetch.ts');

const toastShowMock = vi.fn();

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    show: toastShowMock,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../components/Shared/k8s/index', () => ({
  ApiConfigContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
}));

const refetchQueriesMock = vi.fn();

vi.mock('@apollo/client/react', () => ({
  useMutation: vi.fn(),
  useApolloClient: vi.fn(),
}));

describe('useDeleteManagedControlPlane', () => {
  let mutateMock: Mock;
  let fetchMock: Mock;
  const useMutationMock = vi.mocked(useMutation);
  const useApolloClientMock = vi.mocked(useApolloClient);

  beforeEach(() => {
    mutateMock = vi.fn();
    fetchMock = vi.mocked(fetchApiServerJson);
    useMutationMock.mockReturnValue([mutateMock] as unknown as ReturnType<typeof useMutation>);
    useApolloClientMock.mockReturnValue({ refetchQueries: refetchQueriesMock } as unknown as ReturnType<
      typeof useApolloClient
    >);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('sets the deletion-confirmation annotation via PATCH, deletes, and refetches the MCP list', async () => {
    // ARRANGE
    fetchMock.mockResolvedValue(undefined);
    mutateMock.mockResolvedValue({});

    // ACT
    const { result } = renderHook(() => useDeleteManagedControlPlane('namespace', 'mcpName'));
    await act(async () => {
      await result.current.deleteManagedControlPlane();
    });

    // ASSERT — PATCH confirmation
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [patchUrl, , , patchMethod, patchBody] = fetchMock.mock.calls[0];
    expect(patchUrl).toContain('namespaces/namespace/managedcontrolplanes/mcpName');
    expect(patchMethod).toBe('PATCH');
    expect(JSON.parse(patchBody as string)).toEqual({
      metadata: { annotations: { 'confirmation.openmcp.cloud/deletion': 'true' } },
    });

    // ASSERT — delete mutation
    expect(mutateMock).toHaveBeenCalledTimes(1);
    const deleteCall = mutateMock.mock.calls[0][0] as { variables: unknown };
    expect(deleteCall.variables).toEqual({ name: 'mcpName', namespace: 'namespace' });

    expect(refetchQueriesMock).toHaveBeenCalledWith({ include: ['GetMCPsList'] });
    expect(toastShowMock).toHaveBeenCalledWith('ControlPlaneCard.deleteConfirmationDialog');
  });

  it('shows a toast and rethrows on failure', async () => {
    // ARRANGE
    fetchMock.mockRejectedValue(new Error('API Error'));

    // ACT
    const { result } = renderHook(() => useDeleteManagedControlPlane('namespace', 'mcpName'));

    // ASSERT
    await act(async () => {
      await expect(result.current.deleteManagedControlPlane()).rejects.toThrow('API Error');
    });

    expect(toastShowMock).toHaveBeenCalledWith('API Error');
    expect(refetchQueriesMock).not.toHaveBeenCalled();
  });
});
