import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCreateResource } from './useCreateResource';
import { useMcpContext } from '../lib/shared/McpContext';
import { useApiResource } from '../lib/api/useApiResource';

vi.mock('../lib/shared/McpContext', () => ({
  useMcpContext: vi.fn(),
}));

vi.mock('../lib/api/useApiResource', () => ({
  useApiResource: vi.fn(),
}));

vi.mock('yaml', () => ({
  parse: vi.fn((content: string) => {
    if (content.includes('invalid')) {
      throw new Error('Invalid YAML');
    }
    const lines = content.split('\n');
    const result: Record<string, any> = {};
    lines.forEach((line) => {
      const [key, value] = line.split(':').map((s) => s.trim());
      if (key && value) {
        if (key === 'metadata') {
          result.metadata = { name: value };
        } else {
          result[key] = value;
        }
      }
    });
    return result;
  }),
}));

describe('useCreateResource', () => {
  const mockMutate = vi.fn();
  const mockMcpContext = {
    name: 'default-namespace',
    project: 'test-project',
    workspace: 'test-workspace',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useMcpContext as any).mockReturnValue(mockMcpContext);
    (useApiResource as any).mockReturnValue({
      mutate: mockMutate,
    });
  });

  it('successfully creates a core API resource', async () => {
    mockMutate.mockResolvedValue({ status: 'success' });

    const { result } = renderHook(() => useCreateResource());

    const yamlContent = `apiVersion: v1
kind: Pod
metadata:
  name: test-pod`;

    const response = await result.current.createResource(yamlContent);

    expect(response.success).toBe(true);
    expect(response.message).toContain('Pod');
    expect(response.message).toContain('test-pod');
    expect(mockMutate).toHaveBeenCalled();
  });

  it('successfully creates a custom API group resource', async () => {
    mockMutate.mockResolvedValue({ status: 'success' });

    const { result } = renderHook(() => useCreateResource());

    const yamlContent = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: test-deployment
  namespace: custom-ns`;

    const response = await result.current.createResource(yamlContent, 'custom-ns');

    expect(response.success).toBe(true);
    expect(response.message).toContain('Deployment');
    expect(response.message).toContain('custom-ns');
  });

  it('uses MCP context namespace when no namespace provided', async () => {
    mockMutate.mockResolvedValue({ status: 'success' });

    const { result } = renderHook(() => useCreateResource());

    const yamlContent = `apiVersion: v1
kind: ConfigMap
metadata:
  name: test-config`;

    const response = await result.current.createResource(yamlContent);

    expect(response.success).toBe(true);
    expect(response.message).toContain('default-namespace');
  });

  it('returns error when YAML is invalid', async () => {
    const { result } = renderHook(() => useCreateResource());

    const yamlContent = 'invalid: yaml: content: broken';

    const response = await result.current.createResource(yamlContent);

    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
  });

  it('returns error when kind is missing', async () => {
    const { result } = renderHook(() => useCreateResource());

    const yamlContent = `apiVersion: v1
metadata:
  name: test-resource`;

    const response = await result.current.createResource(yamlContent);

    expect(response.success).toBe(false);
    expect(response.error).toContain('kind and apiVersion are required');
  });

  it('returns error when apiVersion is missing', async () => {
    const { result } = renderHook(() => useCreateResource());

    const yamlContent = `kind: Pod
metadata:
  name: test-pod`;

    const response = await result.current.createResource(yamlContent);

    expect(response.success).toBe(false);
    expect(response.error).toContain('kind and apiVersion are required');
  });

  it('returns error when metadata.name is missing', async () => {
    const { result } = renderHook(() => useCreateResource());

    const yamlContent = `apiVersion: v1
kind: Pod
metadata: {}`;

    const response = await result.current.createResource(yamlContent);

    expect(response.success).toBe(false);
    expect(response.error).toContain('metadata.name is required');
  });

  it('returns error when no namespace can be determined', async () => {
    (useMcpContext as any).mockReturnValue(null);

    const { result } = renderHook(() => useCreateResource());

    const yamlContent = `apiVersion: v1
kind: Pod
metadata:
  name: test-pod`;

    const response = await result.current.createResource(yamlContent);

    expect(response.success).toBe(false);
    expect(response.error).toContain('No namespace specified');
  });

  it('prefers explicit namespace parameter over YAML namespace', async () => {
    mockMutate.mockResolvedValue({ status: 'success' });

    const { result } = renderHook(() => useCreateResource());

    const yamlContent = `apiVersion: v1
kind: Secret
metadata:
  name: test-secret
  namespace: yaml-namespace`;

    const response = await result.current.createResource(yamlContent, 'override-namespace');

    expect(response.success).toBe(true);
    expect(response.message).toContain('override-namespace');
  });

  it('constructs correct API path for core resources', async () => {
    mockMutate.mockResolvedValue({ status: 'success' });

    const { result } = renderHook(() => useCreateResource());

    const yamlContent = `apiVersion: v1
kind: Service
metadata:
  name: test-service`;

    await result.current.createResource(yamlContent);

    expect(useApiResource).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v1/namespaces/default-namespace/services',
        method: 'POST',
      })
    );
  });

  it('constructs correct API path for grouped resources', async () => {
    mockMutate.mockResolvedValue({ status: 'success' });

    const { result } = renderHook(() => useCreateResource());

    const yamlContent = `apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: test-statefulset`;

    await result.current.createResource(yamlContent);

    expect(useApiResource).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/apis/apps/v1/namespaces/default-namespace/statefulsets',
        method: 'POST',
      })
    );
  });

  it('handles API mutation errors', async () => {
    mockMutate.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCreateResource());

    const yamlContent = `apiVersion: v1
kind: Pod
metadata:
  name: test-pod`;

    const response = await result.current.createResource(yamlContent);

    expect(response.success).toBe(false);
    expect(response.error).toBe('Network error');
  });

  it('handles non-Error exceptions', async () => {
    mockMutate.mockRejectedValue('String error');

    const { result } = renderHook(() => useCreateResource());

    const yamlContent = `apiVersion: v1
kind: Pod
metadata:
  name: test-pod`;

    const response = await result.current.createResource(yamlContent);

    expect(response.success).toBe(false);
    expect(response.error).toBe('String error');
  });

  it('handles object errors with message property', async () => {
    mockMutate.mockRejectedValue({ message: 'Custom error object' });

    const { result } = renderHook(() => useCreateResource());

    const yamlContent = `apiVersion: v1
kind: Pod
metadata:
  name: test-pod`;

    const response = await result.current.createResource(yamlContent);

    expect(response.success).toBe(false);
    expect(response.error).toBe('Custom error object');
  });

  it('returns resource data on successful creation', async () => {
    const mockResource = { metadata: { name: 'test-pod' }, status: 'Running' };
    mockMutate.mockResolvedValue(mockResource);

    const { result } = renderHook(() => useCreateResource());

    const yamlContent = `apiVersion: v1
kind: Pod
metadata:
  name: test-pod`;

    const response = await result.current.createResource(yamlContent);

    expect(response.success).toBe(true);
    expect(response.resource).toEqual(mockResource);
  });
});
