import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCreateResource } from './useCreateResource';

vi.mock('../lib/shared/McpContext', () => ({
  useMcpContext: vi.fn(),
}));

vi.mock('../lib/api/useApiResource', () => ({
  useApiResource: vi.fn(),
}));

describe('useCreateResource', () => {
  const mockMutate = vi.fn();
  const mockMcpContext = {
    name: 'default-namespace',
    project: 'test-project',
    workspace: 'test-workspace',
  };

  beforeEach(async () => {
    // ARRANGE
    const { useMcpContext } = await import('../lib/shared/McpContext');
    const { useApiResource } = await import('../lib/api/useApiResource');

    vi.mocked(useMcpContext).mockReturnValue(mockMcpContext);
    vi.mocked(useApiResource).mockReturnValue({
      mutate: mockMutate,
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully create a core API resource', async () => {
    // ARRANGE
    mockMutate.mockResolvedValue({ status: 'success' });

    const yamlContent = `apiVersion: v1
kind: Pod
metadata:
  name: test-pod`;

    // ACT
    const { result } = renderHook(() => useCreateResource());
    const response = await act(async () => {
      return await result.current.createResource(yamlContent);
    });

    // ASSERT
    expect(response.success).toBe(true);
    expect(response.message).toContain('Pod');
    expect(response.message).toContain('test-pod');
    expect(mockMutate).toHaveBeenCalled();
  });

  it('should successfully create a custom API group resource', async () => {
    // ARRANGE
    mockMutate.mockResolvedValue({ status: 'success' });

    const yamlContent = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: test-deployment
  namespace: custom-ns`;

    // ACT
    const { result } = renderHook(() => useCreateResource());
    const response = await act(async () => {
      return await result.current.createResource(yamlContent, 'custom-ns');
    });

    // ASSERT
    expect(response.success).toBe(true);
    expect(response.message).toContain('Deployment');
    expect(response.message).toContain('custom-ns');
  });

  it('should use MCP context namespace when no namespace provided', async () => {
    // ARRANGE
    mockMutate.mockResolvedValue({ status: 'success' });

    const yamlContent = `apiVersion: v1
kind: ConfigMap
metadata:
  name: test-config`;

    // ACT
    const { result } = renderHook(() => useCreateResource());
    const response = await act(async () => {
      return await result.current.createResource(yamlContent);
    });

    // ASSERT
    expect(response.success).toBe(true);
    expect(response.message).toContain('default-namespace');
  });

  it('should return error when YAML is invalid', async () => {
    // ARRANGE
    const yamlContent = 'invalid: yaml: : : broken';

    // ACT
    const { result } = renderHook(() => useCreateResource());
    const response = await act(async () => {
      return await result.current.createResource(yamlContent);
    });

    // ASSERT
    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
  });

  it('should return error when kind is missing', async () => {
    // ARRANGE
    const yamlContent = `apiVersion: v1
metadata:
  name: test-resource`;

    // ACT
    const { result } = renderHook(() => useCreateResource());
    const response = await act(async () => {
      return await result.current.createResource(yamlContent);
    });

    // ASSERT
    expect(response.success).toBe(false);
    expect(response.error).toContain('kind and apiVersion are required');
  });

  it('should return error when apiVersion is missing', async () => {
    // ARRANGE
    const yamlContent = `kind: Pod
metadata:
  name: test-pod`;

    // ACT
    const { result } = renderHook(() => useCreateResource());
    const response = await act(async () => {
      return await result.current.createResource(yamlContent);
    });

    // ASSERT
    expect(response.success).toBe(false);
    expect(response.error).toContain('kind and apiVersion are required');
  });

  it('should return error when metadata.name is missing', async () => {
    // ARRANGE
    const yamlContent = `apiVersion: v1
kind: Pod
metadata: {}`;

    // ACT
    const { result } = renderHook(() => useCreateResource());
    const response = await act(async () => {
      return await result.current.createResource(yamlContent);
    });

    // ASSERT
    expect(response.success).toBe(false);
    expect(response.error).toContain('metadata.name is required');
  });

  it('should return error when no namespace can be determined', async () => {
    // ARRANGE
    const { useMcpContext } = await import('../lib/shared/McpContext');
    vi.mocked(useMcpContext).mockReturnValue(null);

    const yamlContent = `apiVersion: v1
kind: Pod
metadata:
  name: test-pod`;

    // ACT
    const { result } = renderHook(() => useCreateResource());
    const response = await act(async () => {
      return await result.current.createResource(yamlContent);
    });

    // ASSERT
    expect(response.success).toBe(false);
    expect(response.error).toContain('No namespace specified');
  });

  it('should prefer explicit namespace parameter over YAML namespace', async () => {
    // ARRANGE
    mockMutate.mockResolvedValue({ status: 'success' });

    const yamlContent = `apiVersion: v1
kind: Secret
metadata:
  name: test-secret
  namespace: yaml-namespace`;

    // ACT
    const { result } = renderHook(() => useCreateResource());
    const response = await act(async () => {
      return await result.current.createResource(yamlContent, 'override-namespace');
    });

    // ASSERT
    expect(response.success).toBe(true);
    expect(response.message).toContain('override-namespace');
  });

  it('should handle API mutation errors', async () => {
    // ARRANGE
    mockMutate.mockRejectedValue(new Error('Network error'));

    const yamlContent = `apiVersion: v1
kind: Pod
metadata:
  name: test-pod`;

    // ACT
    const { result } = renderHook(() => useCreateResource());
    const response = await act(async () => {
      return await result.current.createResource(yamlContent);
    });

    // ASSERT
    expect(response.success).toBe(false);
    expect(response.error).toBe('Network error');
  });

  it('should return resource data on successful creation', async () => {
    // ARRANGE
    const mockResource = { metadata: { name: 'test-pod' }, status: 'Running' };
    mockMutate.mockResolvedValue(mockResource);

    const yamlContent = `apiVersion: v1
kind: Pod
metadata:
  name: test-pod`;

    // ACT
    const { result } = renderHook(() => useCreateResource());
    const response = await act(async () => {
      return await result.current.createResource(yamlContent);
    });

    // ASSERT
    expect(response.success).toBe(true);
    expect(response.resource).toEqual(mockResource);
  });
});
