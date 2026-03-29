import { act, renderHook } from '@testing-library/react';
import { useDeleteProject } from './useDeleteProject';
import { describe, it, expect, vi, afterEach, Mock, beforeEach } from 'vitest';
import { useMutation } from '@apollo/client/react';

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

describe('useDeleteProject', () => {
  let mutateMock: Mock;
  const useMutationMock = vi.mocked(useMutation);

  beforeEach(() => {
    mutateMock = vi.fn();
    useMutationMock.mockReturnValue([mutateMock] as unknown as ReturnType<typeof useMutation>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should perform a valid delete project request', async () => {
    mutateMock.mockResolvedValue({});

    const renderHookResult = renderHook(() => useDeleteProject('test-project'));
    const { deleteProject } = renderHookResult.result.current;

    await act(async () => {
      await deleteProject();
    });

    expect(mutateMock).toHaveBeenCalledTimes(1);

    const call = mutateMock.mock.calls[0][0];
    expect(call.variables).toEqual({
      name: 'test-project',
    });
  });

  it('should show toast on API failure without throwing', async () => {
    mutateMock.mockRejectedValue(new Error('API Error'));

    const renderHookResult = renderHook(() => useDeleteProject('test-project'));
    const { deleteProject } = renderHookResult.result.current;

    await act(async () => {
      await expect(deleteProject()).resolves.toBeUndefined();
    });

    expect(toastShowMock).toHaveBeenCalledWith('API Error');
  });

  it('should show toast on network failure without throwing', async () => {
    mutateMock.mockRejectedValue(new TypeError('Network error'));

    const renderHookResult = renderHook(() => useDeleteProject('test-project'));
    const { deleteProject } = renderHookResult.result.current;

    await act(async () => {
      await expect(deleteProject()).resolves.toBeUndefined();
    });

    expect(toastShowMock).toHaveBeenCalledWith('Network error');
    expect(mutateMock).toHaveBeenCalledTimes(1);
  });
});
