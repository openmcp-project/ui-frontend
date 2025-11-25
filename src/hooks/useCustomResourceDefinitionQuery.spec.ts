import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { useCustomResourceDefinitionQuery } from './useCustomResourceDefinitionQuery';
import { CustomResourceDefinition } from '../types/customResourceDefinition';
import * as useApiResourceModule from '../lib/api/useApiResource';
import * as useResourcePluralNamesModule from './useResourcePluralNames';

vi.mock('../lib/api/useApiResource');
vi.mock('./useResourcePluralNames');

describe('useCustomResourceDefinitionQuery', () => {
  let useApiResourceMock: Mock;
  let useResourcePluralNamesMock: Mock;

  beforeEach(() => {
    useApiResourceMock = vi.fn();
    vi.spyOn(useApiResourceModule, 'useApiResource').mockImplementation(useApiResourceMock);

    useResourcePluralNamesMock = vi.fn();
    vi.spyOn(useResourcePluralNamesModule, 'useResourcePluralNames').mockImplementation(useResourcePluralNamesMock);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return schema and CRD data on successful load', async () => {
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

    useResourcePluralNamesMock.mockReturnValue({
      getPluralKind: (kind: string) => kind.toLowerCase() + 's',
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useCustomResourceDefinitionQuery({
        kind: 'Workspace',
        apiGroupName: 'core.openmcp.cloud',
        apiVersion: 'v1alpha1',
      }),
    );

    await waitFor(() => {
      expect(result.current.crdData).toEqual(mockCRD);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
      expect(result.current.schema).toBeDefined();
      expect(result.current.schema).toHaveProperty('type', 'object');
    });
  });

  it('should construct the correct API path for the CRD', () => {
    useApiResourceMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
    });

    useResourcePluralNamesMock.mockReturnValue({
      getPluralKind: (kind: string) => kind.toLowerCase() + 's',
      isLoading: false,
    });

    renderHook(() =>
      useCustomResourceDefinitionQuery({
        kind: 'Workspace',
        apiGroupName: 'core.openmcp.cloud',
        apiVersion: 'v1alpha1',
      }),
    );

    expect(useApiResourceMock).toHaveBeenCalledWith(
      {
        path: '/apis/apiextensions.k8s.io/v1/customresourcedefinitions/workspaces.core.openmcp.cloud',
      },
      undefined,
      undefined,
      false,
    );
  });

  it('should not fetch if the kind is undefined', () => {
    useApiResourceMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined,
    });

    useResourcePluralNamesMock.mockReturnValue({
      getPluralKind: () => '',
      isLoading: false,
    });

    renderHook(() =>
      useCustomResourceDefinitionQuery({
        kind: undefined,
        apiGroupName: 'core.openmcp.cloud',
        apiVersion: 'v1alpha1',
      }),
    );

    expect(useApiResourceMock).toHaveBeenCalledWith(
      {
        path: '/apis/apiextensions.k8s.io/v1/customresourcedefinitions/.core.openmcp.cloud',
      },
      undefined,
      undefined,
      true, // disabled
    );
  });

  it('should return undefined schema and data when CRD is not found', () => {
    useApiResourceMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined,
    });

    useResourcePluralNamesMock.mockReturnValue({
      getPluralKind: (kind: string) => kind.toLowerCase() + 's',
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useCustomResourceDefinitionQuery({
        kind: 'Workspace',
        apiGroupName: 'core.openmcp.cloud',
        apiVersion: 'v1alpha1',
      }),
    );

    expect(result.current.schema).toBeUndefined();
    expect(result.current.crdData).toBeUndefined();
  });

  it('should use the first available version if the specified one is not found', async () => {
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

    useResourcePluralNamesMock.mockReturnValue({
      getPluralKind: (kind: string) => kind.toLowerCase() + 's',
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useCustomResourceDefinitionQuery({
        kind: 'Workspace',
        apiGroupName: 'core.openmcp.cloud',
        apiVersion: 'v1alpha1', // This version doesn't exist
      }),
    );

    await waitFor(() => {
      expect(result.current.schema).toBeDefined();
      expect(result.current.schema?.properties?.spec?.properties).toHaveProperty('fallbackField');
    });
  });

  it('should propagate errors from the API call', () => {
    const mockError = { message: 'Failed to fetch CRD', status: 404 };
    useApiResourceMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
    });

    useResourcePluralNamesMock.mockReturnValue({
      getPluralKind: (kind: string) => kind.toLowerCase() + 's',
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useCustomResourceDefinitionQuery({
        kind: 'Workspace',
        apiGroupName: 'core.openmcp.cloud',
        apiVersion: 'v1alpha1',
      }),
    );

    expect(result.current.error).toEqual(mockError);
    expect(result.current.schema).toBeUndefined();
  });

  it('should select the correct schema for the specified API version', async () => {
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

    useResourcePluralNamesMock.mockReturnValue({
      getPluralKind: (kind: string) => kind.toLowerCase() + 's',
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useCustomResourceDefinitionQuery({
        kind: 'Workspace',
        apiGroupName: 'core.openmcp.cloud',
        apiVersion: 'v1beta1',
      }),
    );

    await waitFor(() => {
      expect(result.current.schema).toBeDefined();
      expect(result.current.schema?.properties?.spec?.properties).toHaveProperty('betaField');
      expect(result.current.schema?.properties?.spec?.properties).not.toHaveProperty('alphaField');
    });
  });
});
