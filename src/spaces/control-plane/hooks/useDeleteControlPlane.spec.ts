import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, Mock, beforeEach } from 'vitest';
import { useMutation } from '@apollo/client/react';
import { useDeleteNewControlPlane } from './useDeleteNewControlPlane.ts';

const toastShowMock = vi.fn();

vi.mock('../../../context/ToastContext', () => ({
  useToast: () => ({
    show: toastShowMock,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@apollo/client/react', () => ({
  useMutation: vi.fn(),
}));

describe('useDeleteManagedControlPlaneV2GraphQL', () => {
  let mutateMock: Mock;
  const useMutationMock = vi.mocked(useMutation);

  beforeEach(() => {
    mutateMock = vi.fn();
    useMutationMock.mockReturnValue([mutateMock] as unknown as ReturnType<typeof useMutation>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should perform a valid delete request with correct variables', async () => {
    // ARRANGE
    mutateMock.mockResolvedValue({});

    // ACT
    const renderHookResult = renderHook(() => useDeleteNewControlPlane('test-project--ws-test', 'my-mcp'));
    const { deleteManagedControlPlaneV2 } = renderHookResult.result.current;

    await act(async () => {
      await deleteManagedControlPlaneV2();
    });

    // ASSERT
    expect(mutateMock).toHaveBeenCalledTimes(1);
    const call = mutateMock.mock.calls[0][0];
    expect(call.variables).toEqual({
      name: 'my-mcp',
      namespace: 'test-project--ws-test',
    });
  });

  it('should show toast with success message on successful deletion', async () => {
    // ARRANGE
    mutateMock.mockResolvedValue({});

    // ACT
    const renderHookResult = renderHook(() => useDeleteNewControlPlane('test-namespace', 'test-mcp'));
    const { deleteManagedControlPlaneV2 } = renderHookResult.result.current;

    await act(async () => {
      await deleteManagedControlPlaneV2();
    });

    // ASSERT
    expect(toastShowMock).toHaveBeenCalledWith('ControlPlaneCard.deleteConfirmationDialog');
  });

  it('should show toast with error message on API failure without throwing', async () => {
    // ARRANGE
    mutateMock.mockRejectedValue(new Error('API Error'));

    // ACT
    const renderHookResult = renderHook(() => useDeleteNewControlPlane('test-namespace', 'test-mcp'));
    const { deleteManagedControlPlaneV2 } = renderHookResult.result.current;

    // ASSERT
    await act(async () => {
      await expect(deleteManagedControlPlaneV2()).resolves.toBeUndefined();
    });

    expect(toastShowMock).toHaveBeenCalledWith('API Error');
  });

  it('should show toast with error message on network failure without throwing', async () => {
    // ARRANGE
    mutateMock.mockRejectedValue(new TypeError('Network error'));

    // ACT
    const renderHookResult = renderHook(() => useDeleteNewControlPlane('test-namespace', 'test-mcp'));
    const { deleteManagedControlPlaneV2 } = renderHookResult.result.current;

    // ASSERT
    await act(async () => {
      await expect(deleteManagedControlPlaneV2()).resolves.toBeUndefined();
    });

    expect(toastShowMock).toHaveBeenCalledWith('Network error');
    expect(mutateMock).toHaveBeenCalledTimes(1);
  });
});
