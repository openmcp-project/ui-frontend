import { act, renderHook } from '@testing-library/react';
import { useDeleteProject } from './useDeleteProject';
import { describe, it, expect, vi, afterEach, Mock, beforeEach } from 'vitest';
import { useMutation } from '@apollo/client/react';

vi.mock('../../../context/ToastContext', () => ({
  useToast: () => ({
    show: vi.fn(),
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

  it('should throw error on API failure', async () => {
    mutateMock.mockRejectedValue(new Error('API Error'));

    const renderHookResult = renderHook(() => useDeleteProject('test-project'));
    const { deleteProject } = renderHookResult.result.current;

    await act(async () => {
      await expect(deleteProject()).rejects.toThrow('API Error');
    });
  });

  it('should throw error on network failure', async () => {
    mutateMock.mockRejectedValue(new TypeError('Network error'));

    const renderHookResult = renderHook(() => useDeleteProject('test-project'));
    const { deleteProject } = renderHookResult.result.current;

    await act(async () => {
      await expect(deleteProject()).rejects.toThrow('Network error');
    });
    expect(mutateMock).toHaveBeenCalledTimes(1);
  });
});
