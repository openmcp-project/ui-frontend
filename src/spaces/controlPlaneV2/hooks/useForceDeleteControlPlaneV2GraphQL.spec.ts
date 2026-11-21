import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, Mock, beforeEach } from 'vitest';
import { useMutation } from '@apollo/client/react';
import { useForceDeleteControlPlaneV2GraphQL } from './useForceDeleteControlPlaneV2GraphQL.ts';
import { FORCE_DELETE_ANNOTATION } from '../../../lib/api/types/shared/keyNames.ts';

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

describe('useForceDeleteControlPlaneV2GraphQL', () => {
  let updateMock: Mock;
  let deleteMock: Mock;
  const useMutationMock = vi.mocked(useMutation);

  beforeEach(() => {
    updateMock = vi.fn().mockResolvedValue({});
    deleteMock = vi.fn().mockResolvedValue({});
    // The hook calls useMutation twice: first for the update, then for the delete.
    useMutationMock
      .mockReturnValueOnce([updateMock] as unknown as ReturnType<typeof useMutation>)
      .mockReturnValueOnce([deleteMock] as unknown as ReturnType<typeof useMutation>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('sets the force-delete annotation and then deletes the control plane', async () => {
    const renderHookResult = renderHook(() =>
      useForceDeleteControlPlaneV2GraphQL('test-namespace', 'test-mcp', { 'existing/annotation': 'keep' }),
    );
    const { forceDeleteManagedControlPlaneV2 } = renderHookResult.result.current;

    await act(async () => {
      await forceDeleteManagedControlPlaneV2();
    });

    expect(updateMock).toHaveBeenCalledTimes(1);
    const updateVars = updateMock.mock.calls[0][0].variables;
    expect(updateVars.name).toBe('test-mcp');
    expect(updateVars.namespace).toBe('test-namespace');
    expect(updateVars.object.metadata.annotations).toEqual({
      'existing/annotation': 'keep',
      [FORCE_DELETE_ANNOTATION]: 'true',
    });

    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(deleteMock.mock.calls[0][0].variables).toEqual({
      name: 'test-mcp',
      namespace: 'test-namespace',
    });
  });

  it('shows a success toast once force deletion is triggered', async () => {
    const renderHookResult = renderHook(() => useForceDeleteControlPlaneV2GraphQL('test-namespace', 'test-mcp'));
    const { forceDeleteManagedControlPlaneV2 } = renderHookResult.result.current;

    await act(async () => {
      await forceDeleteManagedControlPlaneV2();
    });

    expect(toastShowMock).toHaveBeenCalledWith('ControlPlaneCard.forceDeleteConfirmationDialog');
  });

  it('does not delete and surfaces the error when setting the annotation fails', async () => {
    updateMock.mockRejectedValueOnce(new Error('update failed'));

    const renderHookResult = renderHook(() => useForceDeleteControlPlaneV2GraphQL('test-namespace', 'test-mcp'));
    const { forceDeleteManagedControlPlaneV2 } = renderHookResult.result.current;

    await act(async () => {
      await expect(forceDeleteManagedControlPlaneV2()).rejects.toThrow('update failed');
    });

    expect(deleteMock).not.toHaveBeenCalled();
    expect(toastShowMock).toHaveBeenCalledWith('update failed');
  });

  it('surfaces the error when the delete step fails', async () => {
    deleteMock.mockRejectedValueOnce(new Error('delete failed'));

    const renderHookResult = renderHook(() => useForceDeleteControlPlaneV2GraphQL('test-namespace', 'test-mcp'));
    const { forceDeleteManagedControlPlaneV2 } = renderHookResult.result.current;

    await act(async () => {
      await expect(forceDeleteManagedControlPlaneV2()).rejects.toThrow('delete failed');
    });

    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(toastShowMock).toHaveBeenCalledWith('delete failed');
  });
});
