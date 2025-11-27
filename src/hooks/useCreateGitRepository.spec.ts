import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { useCreateGitRepository } from './useCreateGitRepository';
import { fetchApiServerJson } from '../lib/api/fetch';
import { assertNonNullish } from '../utils/test/vitest-utils';

vi.mock('../lib/api/fetch');

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    show: vi.fn(),
  }),
}));

vi.mock('../components/Shared/k8s/index', () => ({
  ApiConfigContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
}));

describe('useCreateGitRepository', () => {
  let fetchMock: Mock;

  beforeEach(() => {
    fetchMock = vi.mocked(fetchApiServerJson);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully create a git repository', async () => {
    // ARRANGE
    fetchMock.mockResolvedValue(undefined);

    const testData = {
      name: 'test-repo',
      namespace: 'default',
      interval: '1m0s',
      url: 'https://github.com/test/repo',
      branch: 'main',
    };

    // ACT
    const renderHookResult = renderHook(() => useCreateGitRepository());
    const { createGitRepository } = renderHookResult.result.current;

    await act(async () => {
      await createGitRepository(testData);
    });

    // ASSERT
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const call = fetchMock.mock.calls[0];
    assertNonNullish(call);
    const [url, _config, _excludeMcpConfig, method, body] = call;

    expect(url).toBe('/apis/source.toolkit.fluxcd.io/v1/namespaces/default/gitrepositories');
    expect(method).toBe('POST');

    const payload = JSON.parse(body as string);
    expect(payload).toEqual({
      apiVersion: 'source.toolkit.fluxcd.io/v1',
      kind: 'GitRepository',
      metadata: {
        name: 'test-repo',
        namespace: 'default',
      },
      spec: {
        interval: '1m0s',
        url: 'https://github.com/test/repo',
        ref: {
          branch: 'main',
        },
      },
    });
  });

  it('should include secretRef when provided', async () => {
    // ARRANGE
    fetchMock.mockResolvedValue(undefined);

    const testData = {
      name: 'test-repo',
      namespace: 'default',
      interval: '1m0s',
      url: 'https://github.com/test/repo',
      branch: 'main',
      secretRef: 'my-secret',
    };

    // ACT
    const renderHookResult = renderHook(() => useCreateGitRepository());
    const { createGitRepository } = renderHookResult.result.current;

    await act(async () => {
      await createGitRepository(testData);
    });

    // ASSERT
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const call = fetchMock.mock.calls[0];
    assertNonNullish(call);
    const [, , , , body] = call;

    const payload = JSON.parse(body as string);
    expect(payload.spec.secretRef).toEqual({ name: 'my-secret' });
  });

  it('should use custom namespace when provided', async () => {
    // ARRANGE
    fetchMock.mockResolvedValue(undefined);

    const testData = {
      name: 'test-repo',
      namespace: 'default',
      interval: '1m0s',
      url: 'https://github.com/test/repo',
      branch: 'main',
    };

    // ACT
    const renderHookResult = renderHook(() => useCreateGitRepository());
    const { createGitRepository } = renderHookResult.result.current;

    await act(async () => {
      await createGitRepository(testData);
    });

    // ASSERT
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const call = fetchMock.mock.calls[0];
    assertNonNullish(call);
    const [url, , , , body] = call;

    expect(url).toBe('/apis/source.toolkit.fluxcd.io/v1/namespaces/default/gitrepositories');

    const payload = JSON.parse(body as string);
    expect(payload.metadata.namespace).toBe('default');
  });

  it('should handle creation failure', async () => {
    // ARRANGE
    fetchMock.mockRejectedValue(new Error('Network error'));

    const testData = {
      name: 'test-repo',
      namespace: 'default',
      interval: '1m0s',
      url: 'https://github.com/test/repo',
      branch: 'main',
    };

    // ACT
    const renderHookResult = renderHook(() => useCreateGitRepository());
    const { createGitRepository } = renderHookResult.result.current;

    let errorThrown = false;
    await act(async () => {
      try {
        await createGitRepository(testData);
      } catch {
        errorThrown = true;
      }
    });

    // ASSERT
    expect(errorThrown).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should build correct payload with all fields', async () => {
    // ARRANGE
    fetchMock.mockResolvedValue(undefined);

    const testData = {
      name: 'my-app-repo',
      namespace: 'default',
      interval: '5m0s',
      url: 'https://github.com/org/app',
      branch: 'develop',
      secretRef: 'git-credentials',
    };

    // ACT
    const renderHookResult = renderHook(() => useCreateGitRepository());
    const { createGitRepository } = renderHookResult.result.current;

    await act(async () => {
      await createGitRepository(testData);
    });

    // ASSERT
    const call = fetchMock.mock.calls[0];
    assertNonNullish(call);
    const [, , , , body] = call;

    const payload = JSON.parse(body as string);
    expect(payload).toEqual({
      apiVersion: 'source.toolkit.fluxcd.io/v1',
      kind: 'GitRepository',
      metadata: {
        name: 'my-app-repo',
        namespace: 'default',
      },
      spec: {
        interval: '5m0s',
        url: 'https://github.com/org/app',
        ref: {
          branch: 'develop',
        },
        secretRef: {
          name: 'git-credentials',
        },
      },
    });
  });
});
