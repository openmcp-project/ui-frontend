import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach, Mock } from 'vitest';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { useDeleteManagedControlPlane } from './useDeleteManagedControlPlane.ts';

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

const refetchQueriesMock = vi.fn();

vi.mock('@apollo/client/react', () => ({
  useMutation: vi.fn(),
  useApolloClient: vi.fn(),
}));

describe('useDeleteManagedControlPlane', () => {
  let mutateMock: Mock;
  const useMutationMock = vi.mocked(useMutation);
  const useApolloClientMock = vi.mocked(useApolloClient);

  beforeEach(() => {
    mutateMock = vi.fn();
    useMutationMock.mockReturnValue([mutateMock] as unknown as ReturnType<typeof useMutation>);
    useApolloClientMock.mockReturnValue({ refetchQueries: refetchQueriesMock } as unknown as ReturnType<
      typeof useApolloClient
    >);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('sets the deletion-confirmation annotation, deletes, and refetches the MCP list', async () => {
    // ARRANGE
    mutateMock.mockResolvedValue({});

    // ACT
    const { result } = renderHook(() => useDeleteManagedControlPlane('namespace', 'mcpName'));
    await act(async () => {
      await result.current.deleteManagedControlPlane();
    });

    // ASSERT
    expect(mutateMock).toHaveBeenCalledTimes(2);

    // First mutation: SetManagedControlPlaneDeletionConfirmation
    const confirmationCall = mutateMock.mock.calls[0][0] as { variables: { yaml: string } };
    expect(confirmationCall.variables.yaml).toContain('name: mcpName');
    expect(confirmationCall.variables.yaml).toContain('namespace: namespace');
    expect(confirmationCall.variables.yaml).toContain('confirmation.openmcp.cloud/deletion: "true"');

    // Second mutation: DeleteManagedControlPlane
    const deleteCall = mutateMock.mock.calls[1][0] as { variables: unknown };
    expect(deleteCall.variables).toEqual({ name: 'mcpName', namespace: 'namespace' });

    expect(refetchQueriesMock).toHaveBeenCalledWith({ include: ['GetMCPsList'] });
    expect(toastShowMock).toHaveBeenCalledWith('ControlPlaneCard.deleteConfirmationDialog');
  });

  it('shows a toast and rethrows on failure', async () => {
    // ARRANGE
    mutateMock.mockRejectedValue(new Error('API Error'));

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
