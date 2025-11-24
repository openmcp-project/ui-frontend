import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { useCustomResourceDefinitionQuery } from './useCustomResourceDefinitionQuery';
import { CustomResourceDefinition } from '../types/customResourceDefinition';
import * as useApiResourceModule from '../lib/api/useApiResource';

vi.mock('../lib/api/useApiResource');

describe('useCustomResourceDefinitionQuery', () => {
  let useApiResourceMock: Mock;

  beforeEach(() => {
    useApiResourceMock = vi.fn();
    vi.spyOn(useApiResourceModule, 'useApiResource').mockImplementation(useApiResourceMock);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return schema and crdData when CRD is loaded successfully', async () => {
    // ARRANGE
    const mockCRD: CustomResourceDefinition = {
      kind: 'CustomResourceDefinition',
      apiVersion: 'apiextensions.k8s.io/v1',
      metadata: {
        name: 'workspaces.core.openmcp.cloud',
        uid: 'test-uid',
        resourceVersion: '1',
        generation: 1,
        creationTimestamp: '2024-01-01T00:00:00Z',
      },
      spec: {
        group: 'core.openmcp.cloud',
        names: {
          plural: 'workspaces',
          singular: 'workspace',
          kind: 'Workspace',
          listKind: 'WorkspaceList',
        },
        scope: 'Namespaced',
        versions: [
          {
            name: 'v1alpha1',
            served: true,
            storage: true,
            schema: {
              openAPIV3Schema: {
                type: 'object',
                properties: {
                  spec: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        ],
        conversion: {
          strategy: 'None',
        },
      },
    };

    useApiResourceMock.mockReturnValue({
      data: mockCRD,
      isLoading: false,
      error: undefined,
    });

    // ACT
    const { result } = renderHook(() =>
      useCustomResourceDefinitionQuery({
        kind: 'Workspace',
        apiGroupName: 'core.openmcp.cloud',
        apiVersion: 'v1alpha1',
      }),
    );

    // ASSERT
    await waitFor(() => {
      expect(result.current.crdData).toEqual(mockCRD);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
      expect(result.current.schema).toBeDefined();
      expect(result.current.schema).toHaveProperty('type', 'object');
    });
  });

  it('should call useApiResource with correct path and parameters', () => {
    // ARRANGE
    useApiResourceMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
    });

    // ACT
    renderHook(() =>
      useCustomResourceDefinitionQuery({
        kind: 'Workspace',
        apiGroupName: 'core.openmcp.cloud',
        apiVersion: 'v1alpha1',
      }),
    );

    // ASSERT
    expect(useApiResourceMock).toHaveBeenCalledWith(
      {
        path: '/apis/apiextensions.k8s.io/v1/customresourcedefinitions/workspaces.core.openmcp.cloud',
      },
      undefined,
      undefined,
      false,
    );
  });

  it('should disable API call when kind is undefined', () => {
    // ARRANGE
    useApiResourceMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined,
    });

    // ACT
    renderHook(() =>
      useCustomResourceDefinitionQuery({
        kind: undefined,
        apiGroupName: 'core.openmcp.cloud',
        apiVersion: 'v1alpha1',
      }),
    );

    // ASSERT
    expect(useApiResourceMock).toHaveBeenCalledWith(
      {
        path: '/apis/apiextensions.k8s.io/v1/customresourcedefinitions/undefined.core.openmcp.cloud',
      },
      undefined,
      undefined,
      true, // disabled
    );
  });

  it('should return undefined schema when no CRD data is available', () => {
    // ARRANGE
    useApiResourceMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined,
    });

    // ACT
    const { result } = renderHook(() =>
      useCustomResourceDefinitionQuery({
        kind: 'Workspace',
        apiGroupName: 'core.openmcp.cloud',
        apiVersion: 'v1alpha1',
      }),
    );

    // ASSERT
    expect(result.current.schema).toBeUndefined();
    expect(result.current.crdData).toBeUndefined();
  });

  it('should fall back to first version when specified apiVersion is not found', async () => {
    // ARRANGE
    const mockCRD: CustomResourceDefinition = {
      kind: 'CustomResourceDefinition',
      apiVersion: 'apiextensions.k8s.io/v1',
      metadata: {
        name: 'workspaces.core.openmcp.cloud',
        uid: 'test-uid',
        resourceVersion: '1',
        generation: 1,
        creationTimestamp: '2024-01-01T00:00:00Z',
      },
      spec: {
        group: 'core.openmcp.cloud',
        names: {
          plural: 'workspaces',
          singular: 'workspace',
          kind: 'Workspace',
          listKind: 'WorkspaceList',
        },
        scope: 'Namespaced',
        versions: [
          {
            name: 'v1beta1',
            served: true,
            storage: true,
            schema: {
              openAPIV3Schema: {
                type: 'object',
                properties: {
                  spec: {
                    type: 'object',
                    properties: {
                      fallbackField: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        ],
        conversion: {
          strategy: 'None',
        },
      },
    };

    useApiResourceMock.mockReturnValue({
      data: mockCRD,
      isLoading: false,
      error: undefined,
    });

    // ACT
    const { result } = renderHook(() =>
      useCustomResourceDefinitionQuery({
        kind: 'Workspace',
        apiGroupName: 'core.openmcp.cloud',
        apiVersion: 'v1alpha1', // This version doesn't exist
      }),
    );

    // ASSERT
    await waitFor(() => {
      expect(result.current.schema).toBeDefined();
      // Should use the fallback (first version's) schema
      expect(result.current.schema?.properties?.spec?.properties).toHaveProperty('fallbackField');
    });
  });

  it('should return error when API call fails', () => {
    // ARRANGE
    const mockError = { message: 'Failed to fetch CRD', status: 404 };
    useApiResourceMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
    });

    // ACT
    const { result } = renderHook(() =>
      useCustomResourceDefinitionQuery({
        kind: 'Workspace',
        apiGroupName: 'core.openmcp.cloud',
        apiVersion: 'v1alpha1',
      }),
    );

    // ASSERT
    expect(result.current.error).toEqual(mockError);
    expect(result.current.schema).toBeUndefined();
  });

  it('should handle multiple versions and select correct one', async () => {
    // ARRANGE
    const mockCRD: CustomResourceDefinition = {
      kind: 'CustomResourceDefinition',
      apiVersion: 'apiextensions.k8s.io/v1',
      metadata: {
        name: 'workspaces.core.openmcp.cloud',
        uid: 'test-uid',
        resourceVersion: '1',
        generation: 1,
        creationTimestamp: '2024-01-01T00:00:00Z',
      },
      spec: {
        group: 'core.openmcp.cloud',
        names: {
          plural: 'workspaces',
          singular: 'workspace',
          kind: 'Workspace',
          listKind: 'WorkspaceList',
        },
        scope: 'Namespaced',
        versions: [
          {
            name: 'v1alpha1',
            served: true,
            storage: false,
            schema: {
              openAPIV3Schema: {
                type: 'object',
                properties: {
                  spec: {
                    type: 'object',
                    properties: {
                      alphaField: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
          {
            name: 'v1beta1',
            served: true,
            storage: true,
            schema: {
              openAPIV3Schema: {
                type: 'object',
                properties: {
                  spec: {
                    type: 'object',
                    properties: {
                      betaField: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        ],
        conversion: {
          strategy: 'None',
        },
      },
    };

    useApiResourceMock.mockReturnValue({
      data: mockCRD,
      isLoading: false,
      error: undefined,
    });

    // ACT
    const { result } = renderHook(() =>
      useCustomResourceDefinitionQuery({
        kind: 'Workspace',
        apiGroupName: 'core.openmcp.cloud',
        apiVersion: 'v1beta1',
      }),
    );

    // ASSERT
    await waitFor(() => {
      expect(result.current.schema).toBeDefined();
      // Should use v1beta1's schema, not v1alpha1
      expect(result.current.schema?.properties?.spec?.properties).toHaveProperty('betaField');
      expect(result.current.schema?.properties?.spec?.properties).not.toHaveProperty('alphaField');
    });
  });
});
