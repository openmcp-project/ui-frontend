import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, Mock, beforeEach } from 'vitest';
import { useMutation } from '@apollo/client/react';
import { McpV2Input } from '../../mcp/schemas/mcpV2Input.schema.ts';
import { useCreateControlPlaneV2GraphQL } from './useCreateControlPlaneV2GraphQL.ts';

const reportMock = vi.fn();

vi.mock('../../../lib/telemetry/telemetry.ts', () => ({
  useTelemetry: () => ({
    track: vi.fn(),
    report: reportMock,
    breadcrumb: vi.fn(),
    identify: vi.fn(),
  }),
}));

vi.mock('@apollo/client/react', () => ({
  useMutation: vi.fn(),
}));

const validInput: McpV2Input = {
  name: 'my-mcp',
  namespace: 'test-project--ws-test',
  roleBindings: [],
  extraProviders: [],
};

const createdControlPlane = {
  metadata: { name: 'my-mcp', namespace: 'test-project--ws-test' },
  status: { phase: 'Pending' },
};

describe('useCreateControlPlaneV2GraphQL', () => {
  let mutateMock: Mock;
  const useMutationMock = vi.mocked(useMutation);

  beforeEach(() => {
    mutateMock = vi.fn();
    useMutationMock.mockReturnValue([mutateMock, { loading: false }] as unknown as ReturnType<typeof useMutation>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should perform a valid create request with correct variables and return the created control plane', async () => {
    // ARRANGE
    mutateMock.mockResolvedValue({
      data: { core_open_control_plane_io: { v2alpha1: { createControlPlane: createdControlPlane } } },
    });

    // ACT
    const { result } = renderHook(() => useCreateControlPlaneV2GraphQL());
    let created: unknown;
    await act(async () => {
      created = await result.current.createMcp(validInput);
    });

    // ASSERT
    expect(mutateMock).toHaveBeenCalledTimes(1);
    const call = mutateMock.mock.calls[0][0];
    expect(call.variables.namespace).toBe('test-project--ws-test');
    expect(call.variables.object).toBeDefined();
    expect(created).toEqual(createdControlPlane);
    expect(reportMock).not.toHaveBeenCalled();
  });

  it('should report a schema mismatch to Sentry and throw without calling the mutation', async () => {
    // ARRANGE
    const invalidInput = { ...validInput, name: '' } as McpV2Input;

    // ACT / ASSERT
    const { result } = renderHook(() => useCreateControlPlaneV2GraphQL());
    await act(async () => {
      await expect(result.current.createMcp(invalidInput)).rejects.toThrow('Invalid ManagedControlPlaneV2 input');
    });

    expect(reportMock).toHaveBeenCalledTimes(1);
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it('should throw when the mutation returns no control plane data', async () => {
    // ARRANGE
    mutateMock.mockResolvedValue({ data: { core_open_control_plane_io: { v2alpha1: { createControlPlane: null } } } });

    // ACT / ASSERT
    const { result } = renderHook(() => useCreateControlPlaneV2GraphQL());
    await act(async () => {
      await expect(result.current.createMcp(validInput)).rejects.toThrow('creation returned no data');
    });
  });

  it('should propagate a network failure without reporting to Sentry', async () => {
    // ARRANGE
    mutateMock.mockRejectedValue(new TypeError('Network error'));

    // ACT / ASSERT
    const { result } = renderHook(() => useCreateControlPlaneV2GraphQL());
    await act(async () => {
      await expect(result.current.createMcp(validInput)).rejects.toThrow('Network error');
    });

    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(reportMock).not.toHaveBeenCalled();
  });
});
