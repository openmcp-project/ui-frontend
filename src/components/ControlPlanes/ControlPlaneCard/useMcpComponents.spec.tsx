import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMcpComponents } from './useMcpComponents';
import * as useApiResourceModule from '../../../lib/api/useApiResource';

// Mock the useApiResource hook
vi.mock('../../../lib/api/useApiResource');

describe('useMcpComponents', () => {
  const mockUseApiResource = vi.mocked(useApiResourceModule.useApiResource);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null components when data is loading', () => {
    mockUseApiResource.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
      refetch: vi.fn(),
      isFetching: false,
      isPending: true,
      isSuccess: false,
      isError: false,
    });

    const { result } = renderHook(() => useMcpComponents('project-1', 'workspace-1', 'mcp-1'));

    expect(result.current.components).toBeNull();
    expect(result.current.roleBindings).toBeUndefined();
    expect(result.current.isLoading).toBe(true);
  });

  it('extracts components from MCP spec', () => {
    const mockMcp = {
      spec: {
        components: {
          crossplane: { version: '1.14.0' },
          flux: { version: '2.1.0' },
          kyverno: { version: '3.0.0' },
        },
      },
    };

    mockUseApiResource.mockReturnValue({
      data: mockMcp,
      isLoading: false,
      error: undefined,
      refetch: vi.fn(),
      isFetching: false,
      isPending: false,
      isSuccess: true,
      isError: false,
    });

    const { result } = renderHook(() => useMcpComponents('project-1', 'workspace-1', 'mcp-1'));

    expect(result.current.components).toEqual({
      crossplane: { version: '1.14.0' },
      flux: { version: '2.1.0' },
      kyverno: { version: '3.0.0' },
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('extracts roleBindings from MCP authorization spec', () => {
    const mockMcp = {
      spec: {
        authorization: {
          roleBindings: [
            {
              role: 'admin',
              subjects: [{ kind: 'User', name: 'user@example.com' }],
            },
            {
              role: 'viewer',
              subjects: [{ kind: 'User', name: 'viewer@example.com' }],
            },
          ],
        },
      },
    };

    mockUseApiResource.mockReturnValue({
      data: mockMcp,
      isLoading: false,
      error: undefined,
      refetch: vi.fn(),
      isFetching: false,
      isPending: false,
      isSuccess: true,
      isError: false,
    });

    const { result } = renderHook(() => useMcpComponents('project-1', 'workspace-1', 'mcp-1'));

    expect(result.current.roleBindings).toEqual([
      {
        role: 'admin',
        subjects: [{ kind: 'User', name: 'user@example.com' }],
      },
      {
        role: 'viewer',
        subjects: [{ kind: 'User', name: 'viewer@example.com' }],
      },
    ]);
  });

  it('handles MCP without components spec', () => {
    const mockMcp = {
      spec: {
        authorization: {
          roleBindings: [],
        },
      },
    };

    mockUseApiResource.mockReturnValue({
      data: mockMcp,
      isLoading: false,
      error: undefined,
      refetch: vi.fn(),
      isFetching: false,
      isPending: false,
      isSuccess: true,
      isError: false,
    });

    const { result } = renderHook(() => useMcpComponents('project-1', 'workspace-1', 'mcp-1'));

    expect(result.current.components).toBeNull();
    expect(result.current.roleBindings).toEqual([]);
  });

  it('handles MCP without authorization spec', () => {
    const mockMcp = {
      spec: {
        components: {
          crossplane: { version: '1.14.0' },
        },
      },
    };

    mockUseApiResource.mockReturnValue({
      data: mockMcp,
      isLoading: false,
      error: undefined,
      refetch: vi.fn(),
      isFetching: false,
      isPending: false,
      isSuccess: true,
      isError: false,
    });

    const { result } = renderHook(() => useMcpComponents('project-1', 'workspace-1', 'mcp-1'));

    expect(result.current.components).toEqual({
      crossplane: { version: '1.14.0' },
    });
    expect(result.current.roleBindings).toBeUndefined();
  });

  it('handles completely empty MCP spec', () => {
    const mockMcp = {
      spec: {},
    };

    mockUseApiResource.mockReturnValue({
      data: mockMcp,
      isLoading: false,
      error: undefined,
      refetch: vi.fn(),
      isFetching: false,
      isPending: false,
      isSuccess: true,
      isError: false,
    });

    const { result } = renderHook(() => useMcpComponents('project-1', 'workspace-1', 'mcp-1'));

    expect(result.current.components).toBeNull();
    expect(result.current.roleBindings).toBeUndefined();
  });

  it('handles all component types', () => {
    const mockMcp = {
      spec: {
        components: {
          crossplane: { version: '1.14.0' },
          flux: { version: '2.1.0' },
          landscaper: {},
          kyverno: { version: '3.0.0' },
          externalSecretsOperator: { version: '0.9.0' },
        },
      },
    };

    mockUseApiResource.mockReturnValue({
      data: mockMcp,
      isLoading: false,
      error: undefined,
      refetch: vi.fn(),
      isFetching: false,
      isPending: false,
      isSuccess: true,
      isError: false,
    });

    const { result } = renderHook(() => useMcpComponents('project-1', 'workspace-1', 'mcp-1'));

    expect(result.current.components).toEqual({
      crossplane: { version: '1.14.0' },
      flux: { version: '2.1.0' },
      landscaper: {},
      kyverno: { version: '3.0.0' },
      externalSecretsOperator: { version: '0.9.0' },
    });
  });

  it('memoizes components correctly on data change', () => {
    const mockMcp1 = {
      spec: {
        components: {
          crossplane: { version: '1.14.0' },
        },
      },
    };

    const mockMcp2 = {
      spec: {
        components: {
          crossplane: { version: '1.15.0' },
        },
      },
    };

    mockUseApiResource.mockReturnValue({
      data: mockMcp1,
      isLoading: false,
      error: undefined,
      refetch: vi.fn(),
      isFetching: false,
      isPending: false,
      isSuccess: true,
      isError: false,
    });

    const { result, rerender } = renderHook(() => useMcpComponents('project-1', 'workspace-1', 'mcp-1'));

    const firstComponents = result.current.components;
    expect(firstComponents).toEqual({ crossplane: { version: '1.14.0' } });

    // Update mock data
    mockUseApiResource.mockReturnValue({
      data: mockMcp2,
      isLoading: false,
      error: undefined,
      refetch: vi.fn(),
      isFetching: false,
      isPending: false,
      isSuccess: true,
      isError: false,
    });

    rerender();

    expect(result.current.components).toEqual({ crossplane: { version: '1.15.0' } });
    expect(result.current.components).not.toBe(firstComponents);
  });
});
