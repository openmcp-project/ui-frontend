import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { useHandleResourcePatch } from './useHandleResourcePatch.ts';
import { fetchApiServerJson } from '../lib/api/fetch.ts';
import { assertNonNullish } from '../utils/test/vitest-utils.ts';

vi.mock('../lib/api/fetch.ts');

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    show: vi.fn(),
  }),
}));

vi.mock('../hooks/useResourcePluralNames', () => ({
  useResourcePluralNames: () => ({
    getPluralKind: (kind: string) => `${kind.toLowerCase()}s`,
  }),
}));

describe('useHandleResourcePatch', () => {
  let fetchMock: Mock;
  const mockErrorDialogRef = { current: null };

  beforeEach(() => {
    fetchMock = vi.mocked(fetchApiServerJson);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully patch a namespaced resource', async () => {
    // ARRANGE
    fetchMock.mockResolvedValue(undefined);

    const item = {
      kind: 'Subaccount',
      apiVersion: 'account.btp.sap.crossplane.io/v1alpha1',
      metadata: {
        name: 'test-subaccount',
        namespace: 'test-namespace',
      },
    };

    const parsed = { spec: { updated: true } };

    // ACT
    const renderHookResult = renderHook(() => useHandleResourcePatch(mockErrorDialogRef));
    const handlePatch = renderHookResult.result.current;

    let success: boolean = false;
    await act(async () => {
      success = await handlePatch(item, parsed);
    });

    // ASSERT
    expect(success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const call = fetchMock.mock.calls[0];
    assertNonNullish(call);
    const [url, _config, _excludeMcpConfig, method, body] = call;

    expect(url).toBe(
      '/apis/account.btp.sap.crossplane.io/v1alpha1/namespaces/test-namespace/subaccounts/test-subaccount',
    );
    expect(method).toBe('PATCH');
    expect(body).toBe(JSON.stringify(parsed));
  });

  it('should successfully patch a cluster-scoped resource', async () => {
    // ARRANGE
    fetchMock.mockResolvedValue(undefined);

    const item = {
      kind: 'ClusterRole',
      apiVersion: 'rbac.authorization.k8s.io/v1',
      metadata: {
        name: 'test-role',
      },
    };

    const parsed = { spec: { updated: true } };

    // ACT
    const renderHookResult = renderHook(() => useHandleResourcePatch(mockErrorDialogRef));
    const handlePatch = renderHookResult.result.current;

    let success: boolean = false;
    await act(async () => {
      success = await handlePatch(item, parsed);
    });

    // ASSERT
    expect(success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const call = fetchMock.mock.calls[0];
    assertNonNullish(call);
    const [url] = call;

    expect(url).toBe('/apis/rbac.authorization.k8s.io/v1/clusterroles/test-role');
  });

  it('should handle patch failure', async () => {
    // ARRANGE
    fetchMock.mockRejectedValue(new Error('Network error'));

    const item = {
      kind: 'Subaccount',
      apiVersion: 'account.btp.sap.crossplane.io/v1alpha1',
      metadata: {
        name: 'test-subaccount',
        namespace: 'test-namespace',
      },
    };

    const parsed = { spec: { updated: true } };

    // ACT
    const renderHookResult = renderHook(() => useHandleResourcePatch(mockErrorDialogRef));
    const handlePatch = renderHookResult.result.current;

    let success: boolean = true;
    await act(async () => {
      success = await handlePatch(item, parsed);
    });

    // ASSERT
    expect(success).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
