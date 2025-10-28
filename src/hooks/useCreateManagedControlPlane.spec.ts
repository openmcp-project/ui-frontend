import { act, renderHook } from '@testing-library/react';
import { useCreateManagedControlPlane } from './useCreateManagedControlPlane.tsx';
import { CreateManagedControlPlaneType } from '../lib/api/types/crate/createManagedControlPlane.ts';

import { describe, it, expect, vi, afterEach, Mock } from 'vitest';
import { assertNonNullish, assertString } from '../utils/test/vitest-utils.ts';

describe('useCreateManagedControlPlane', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should perform a valid request', async () => {
    // ARRANGE
    const mockData: CreateManagedControlPlaneType = {
      apiVersion: 'core.openmcp.cloud/v1alpha1',
      kind: 'ManagedControlPlane',
      metadata: {
        name: 'name',
        namespace: 'project-projectName--ws-workspaceName',
        annotations: {
          'openmcp.cloud/display-name': 'display-name',
        },
        labels: {
          'openmcp.cloud.sap/charging-target-type': 'BTP',
          'openmcp.cloud.sap/charging-target': 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        },
      },
      spec: {
        authentication: {
          enableSystemIdentityProvider: true,
        },
        components: {
          externalSecretsOperator: {
            version: '0.20.1',
          },
          flux: {
            version: '2.16.2',
          },
          kyverno: {
            version: '3.5.2',
          },
          btpServiceOperator: {
            version: '0.9.2',
          },
          apiServer: {
            type: 'GardenerDedicated',
          },
          crossplane: {
            version: '1.19.0',
            providers: [
              {
                name: 'provider-hana',
                version: '0.2.0',
              },
            ],
          },
        },
        authorization: {
          roleBindings: [
            {
              role: 'admin',
              subjects: [
                {
                  kind: 'User',
                  name: 'openmcp:user@domain.com',
                },
              ],
            },
          ],
        },
      },
    };

    const fetchMock: Mock<typeof fetch> = vi.fn();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({}),
    } as unknown as Response);
    global.fetch = fetchMock;

    // ACT
    const renderHookResult = renderHook(() => useCreateManagedControlPlane('projectName', 'workspaceName'));
    const { mutate: create } = renderHookResult.result.current;

    await act(async () => {
      await create(mockData);
    });

    // ASSERT
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0];
    const [url, init] = call;
    assertNonNullish(init);
    const { method, headers, body } = init;

    expect(url).toContain(
      '/api/onboarding/apis/core.openmcp.cloud/v1alpha1/namespaces/projectName--ws-workspaceName/managedcontrolplanes',
    );

    expect(method).toBe('POST');

    expect(headers).toEqual(
      expect.objectContaining({
        'Content-Type': 'application/json',
        'X-use-crate': 'true',
      }),
    );

    assertString(body);
    const parsedBody = JSON.parse(body);
    expect(parsedBody).toEqual(mockData);
  });
});
