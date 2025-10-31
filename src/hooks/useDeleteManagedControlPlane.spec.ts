import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, Mock } from 'vitest';
import { assertNonNullish, assertString } from '../utils/test/vitest-utils.ts';

import { useDeleteManagedControlPlane } from './useDeleteManagedControlPlane.ts';

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    show: vi.fn(),
  }),
}));

describe.only('useDeleteManagedControlPlane', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should perform a valid delete request', async () => {
    const fetchMock: Mock<typeof fetch> = vi.fn();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({}),
    } as unknown as Response);
    global.fetch = fetchMock;

    // ACT
    const renderHookResult = renderHook(() => useDeleteManagedControlPlane('namespace', 'mcpName'));
    const { deleteManagedControlPlane } = renderHookResult.result.current;

    await act(async () => {
      await deleteManagedControlPlane();
    });

    // ASSERT
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Assert PATCH call
    const patchCall = fetchMock.mock.calls[0];
    const [patchUrl, patchInit] = patchCall;
    assertNonNullish(patchInit);
    const { method: patchMethod, headers: patchHeaders, body: patchBody } = patchInit;

    expect(patchUrl).toContain(
      '/api/onboarding/apis/core.openmcp.cloud/v1alpha1/namespaces/namespace/managedcontrolplanes/mcpName?fieldManager=kubectl-annotate',
    );

    expect(patchMethod).toBe('PATCH');

    expect(patchHeaders).toEqual(
      expect.objectContaining({
        'Content-Type': 'application/merge-patch+json',
        'X-use-crate': 'true',
      }),
    );

    assertString(patchBody);
    const parsedPatchBody = JSON.parse(patchBody);
    expect(parsedPatchBody).toEqual({
      metadata: {
        annotations: {
          'confirmation.openmcp.cloud/deletion': 'true',
        },
      },
    });

    // Assert DELETE call
    const postCall = fetchMock.mock.calls[1];
    const [postUrl, postInit] = postCall;
    assertNonNullish(postInit);
    const { method: postMethod, headers: postHeaders, body: postBody } = postInit;

    expect(postUrl).toContain(
      '/api/onboarding/apis/core.openmcp.cloud/v1alpha1/namespaces/namespace/managedcontrolplanes/mcpName',
    );

    expect(postMethod).toBe('DELETE');

    expect(postHeaders).toEqual(
      expect.objectContaining({
        'Content-Type': 'application/json',
        'X-use-crate': 'true',
      }),
    );

    expect(postBody).toBeUndefined();
  });
});
