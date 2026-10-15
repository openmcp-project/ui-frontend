import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { useCreateManagedControlPlane } from './useCreateManagedControlPlane.ts';
import type { CreateManagedControlPlaneType } from '../lib/api/types/crate/createManagedControlPlane.ts';

const { mockCreateMutation } = vi.hoisted(() => ({
  mockCreateMutation: vi.fn().mockResolvedValue({ data: {} }),
}));

vi.mock('@apollo/client/react', () => ({
  useMutation: () => [mockCreateMutation, {}],
}));

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

    // ACT
    const renderHookResult = renderHook(() => useCreateManagedControlPlane('projectName', 'workspaceName'));
    const { mutate: create } = renderHookResult.result.current;

    await act(async () => {
      await create(mockData);
    });

    // ASSERT
    expect(mockCreateMutation).toHaveBeenCalledTimes(1);
    expect(mockCreateMutation).toHaveBeenCalledWith({
      variables: {
        namespace: 'projectName--ws-workspaceName',
        object: mockData,
      },
    });
  });
});
