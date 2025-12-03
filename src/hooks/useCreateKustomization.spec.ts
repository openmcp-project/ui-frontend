import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { useCreateKustomization } from './useCreateKustomization';
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

vi.mock('../lib/api/useApiResource', () => ({
  useRevalidateApiResource: () => vi.fn(),
}));

describe('useCreateKustomization', () => {
  let fetchMock: Mock;

  beforeEach(() => {
    fetchMock = vi.mocked(fetchApiServerJson);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully create a kustomization with minimal data', async () => {
    // ARRANGE
    fetchMock.mockResolvedValue(undefined);

    const testData = {
      name: 'test-kustomization',
      namespace: 'default',
      interval: '1m0s',
      sourceRefName: 'test-repo',
      path: './',
      prune: true,
    };

    // ACT
    const renderHookResult = renderHook(() => useCreateKustomization());
    const { createKustomization } = renderHookResult.result.current;

    await act(async () => {
      await createKustomization(testData);
    });

    // ASSERT
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const call = fetchMock.mock.calls[0];
    assertNonNullish(call);
    const [url, _config, _excludeMcpConfig, method, body] = call;

    expect(url).toBe('/apis/kustomize.toolkit.fluxcd.io/v1/namespaces/default/kustomizations');
    expect(method).toBe('POST');

    const payload = JSON.parse(body as string);
    expect(payload).toEqual({
      apiVersion: 'kustomize.toolkit.fluxcd.io/v1',
      kind: 'Kustomization',
      metadata: {
        name: 'test-kustomization',
        namespace: 'default',
      },
      spec: {
        interval: '1m0s',
        sourceRef: {
          kind: 'GitRepository',
          name: 'test-repo',
        },
        path: './',
        prune: true,
      },
    });
  });

  it('should include targetNamespace when provided', async () => {
    // ARRANGE
    fetchMock.mockResolvedValue(undefined);

    const testData = {
      name: 'test-kustomization',
      namespace: 'default',
      interval: '1m0s',
      sourceRefName: 'test-repo',
      path: './',
      prune: true,
      targetNamespace: 'target-ns',
    };

    // ACT
    const renderHookResult = renderHook(() => useCreateKustomization());
    const { createKustomization } = renderHookResult.result.current;

    await act(async () => {
      await createKustomization(testData);
    });

    // ASSERT
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const call = fetchMock.mock.calls[0];
    assertNonNullish(call);
    const [, , , , body] = call;

    const payload = JSON.parse(body as string);
    expect(payload.spec.targetNamespace).toBe('target-ns');
  });

  it('should include substitutions when provided', async () => {
    // ARRANGE
    fetchMock.mockResolvedValue(undefined);

    const testData = {
      name: 'test-kustomization',
      namespace: 'default',
      interval: '1m0s',
      sourceRefName: 'test-repo',
      path: './',
      prune: true,
      substitutions: [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' },
      ],
    };

    // ACT
    const renderHookResult = renderHook(() => useCreateKustomization());
    const { createKustomization } = renderHookResult.result.current;

    await act(async () => {
      await createKustomization(testData);
    });

    // ASSERT
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const call = fetchMock.mock.calls[0];
    assertNonNullish(call);
    const [, , , , body] = call;

    const payload = JSON.parse(body as string);
    expect(payload.spec.postBuild).toEqual({
      substitute: {
        key1: 'value1',
        key2: 'value2',
      },
    });
  });

  it('should handle creation failure', async () => {
    // ARRANGE
    fetchMock.mockRejectedValue(new Error('Network error'));

    const testData = {
      name: 'test-kustomization',
      namespace: 'default',
      interval: '1m0s',
      sourceRefName: 'test-repo',
      path: './',
      prune: true,
    };

    // ACT
    const renderHookResult = renderHook(() => useCreateKustomization());
    const { createKustomization } = renderHookResult.result.current;

    let errorThrown = false;
    await act(async () => {
      try {
        await createKustomization(testData);
      } catch {
        errorThrown = true;
      }
    });

    // ASSERT
    expect(errorThrown).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
