import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { useDeleteWorkspace } from './useDeleteWorkspace';
import { describe, it, expect, vi, afterEach, Mock, beforeEach } from 'vitest';
import { assertNonNullish } from '../utils/test/vitest-utils';

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

describe('useDeleteWorkspace', () => {
  let fetchMock: Mock<typeof fetch>;
  let apolloClient: ApolloClient<unknown>;

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(ApolloProvider, { client: apolloClient }, children);

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    apolloClient = new ApolloClient({
      cache: new InMemoryCache(),
      link: ApolloLink.empty(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should perform a valid delete workspace request', async () => {
    // ARRANGE
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({}),
    } as unknown as Response);

    // ACT
    const renderHookResult = renderHook(() => useDeleteWorkspace('test-project--ns', 'test-workspace'), { wrapper });
    const { deleteWorkspace } = renderHookResult.result.current;

    await act(async () => {
      await deleteWorkspace();
    });

    // ASSERT
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const call = fetchMock.mock.calls[0];
    const [url, init] = call;
    assertNonNullish(init);
    const { method, headers } = init;

    expect(url).toContain(
      '/api/onboarding/apis/core.openmcp.cloud/v1alpha1/namespaces/test-project--ns/workspaces/test-workspace',
    );
    expect(method).toBe('DELETE');
    expect(headers).toEqual(
      expect.objectContaining({
        'Content-Type': 'application/json',
        'X-use-crate': 'true',
      }),
    );
  });

  it('should throw error on API failure', async () => {
    // ARRANGE
    fetchMock.mockRejectedValue(new Error('API Error'));

    // ACT
    const renderHookResult = renderHook(() => useDeleteWorkspace('test-project--ns', 'test-workspace'), { wrapper });
    const { deleteWorkspace } = renderHookResult.result.current;

    // ASSERT
    await act(async () => {
      await expect(deleteWorkspace()).rejects.toThrow('API Error');
    });
  });

  it('should throw error on network failure', async () => {
    // ARRANGE
    fetchMock.mockRejectedValue(new TypeError('Network error'));

    // ACT
    const renderHookResult = renderHook(() => useDeleteWorkspace('test-project--ns', 'test-workspace'), { wrapper });
    const { deleteWorkspace } = renderHookResult.result.current;

    // ASSERT
    await act(async () => {
      await expect(deleteWorkspace()).rejects.toThrow('Network error');
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
