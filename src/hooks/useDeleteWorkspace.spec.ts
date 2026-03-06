import { act, renderHook } from '@testing-library/react';
import { useDeleteWorkspace } from './useDeleteWorkspace';
import { describe, it, expect, vi, afterEach, Mock, beforeEach } from 'vitest';
import { useMutation } from '@apollo/client/react';

// Mock toast and translation
vi.mock('../context/ToastContext', () => ({
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

describe('useDeleteWorkspace', () => {
  let mutateMock: Mock;
  const useMutationMock = vi.mocked(useMutation);

  beforeEach(() => {
    mutateMock = vi.fn();
    useMutationMock.mockReturnValue([mutateMock] as unknown as ReturnType<typeof useMutation>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should perform a valid delete workspace request', async () => {
    // ARRANGE
    mutateMock.mockResolvedValue({});

    // ACT
    const renderHookResult = renderHook(() => useDeleteWorkspace('test-project--ns', 'test-workspace'));
    const { deleteWorkspace } = renderHookResult.result.current;

    await act(async () => {
      await deleteWorkspace();
    });

    // ASSERT
    expect(mutateMock).toHaveBeenCalledTimes(1);
    const call = mutateMock.mock.calls[0][0];
    expect(call.variables).toEqual({
      name: 'test-workspace',
      namespace: 'test-project--ns',
    });
  });

  it('should throw error on API failure', async () => {
    // ARRANGE
    mutateMock.mockRejectedValue(new Error('API Error'));

    // ACT
    const renderHookResult = renderHook(() => useDeleteWorkspace('test-project--ns', 'test-workspace'));
    const { deleteWorkspace } = renderHookResult.result.current;

    // ASSERT
    await act(async () => {
      await expect(deleteWorkspace()).rejects.toThrow('API Error');
    });
  });

  it('should throw error on network failure', async () => {
    // ARRANGE
    mutateMock.mockRejectedValue(new TypeError('Network error'));

    // ACT
    const renderHookResult = renderHook(() => useDeleteWorkspace('test-project--ns', 'test-workspace'));
    const { deleteWorkspace } = renderHookResult.result.current;

    // ASSERT
    await act(async () => {
      await expect(deleteWorkspace()).rejects.toThrow('Network error');
    });
    expect(mutateMock).toHaveBeenCalledTimes(1);
  });
});
