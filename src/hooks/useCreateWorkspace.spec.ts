import { act, renderHook } from '@testing-library/react';
import { useCreateWorkspace } from './useCreateWorkspace';
import { describe, it, expect, vi, afterEach, Mock, beforeEach } from 'vitest';
import { MemberRoles } from '../lib/api/types/shared/members';
import { useMutation } from '@apollo/client/react';

// Mock toast and translation
vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    show: vi.fn(),
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@apollo/client/react', () => ({
  useMutation: vi.fn(),
}));

describe('useCreateWorkspace', () => {
  let mutateMock: Mock;
  const useMutationMock = vi.mocked(useMutation);

  beforeEach(() => {
    mutateMock = vi.fn();
    useMutationMock.mockReturnValue([mutateMock] as unknown as ReturnType<typeof useMutation>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should perform a valid create workspace request', async () => {
    // ARRANGE
    const mockWorkspaceData = {
      name: 'test-workspace',
      displayName: 'Test Workspace',
      chargingTarget: '12345678-1234-1234-1234-123456789abc',
      members: [
        {
          name: 'user@domain.com',
          roles: [MemberRoles.admin],
          kind: 'User' as const,
        },
      ],
    };

    mutateMock.mockResolvedValue({});

    // ACT
    const renderHookResult = renderHook(() => useCreateWorkspace('test-project--ns'));
    const { createWorkspace } = renderHookResult.result.current;

    await act(async () => {
      await createWorkspace(mockWorkspaceData);
    });

    // ASSERT
    expect(mutateMock).toHaveBeenCalledTimes(1);

    const call = mutateMock.mock.calls[0][0];
    const { variables } = call;
    expect(variables.namespace).toBe('test-project--ns');
    expect(variables.object.metadata.name).toBe('test-workspace');
    expect(variables.object.metadata.annotations?.['openmcp.cloud/display-name']).toBe('Test Workspace');
    expect(variables.object.metadata.labels?.['openmcp.cloud.sap/charging-target']).toBe(
      '12345678-1234-1234-1234-123456789abc',
    );
    expect(variables.object.spec.members).toHaveLength(1);
    expect(variables.object.spec.members[0].name).toBe('user@domain.com');
  });

  it('should throw error on API failure', async () => {
    // ARRANGE
    mutateMock.mockRejectedValue(new Error('API Error'));

    const mockWorkspaceData = {
      name: 'test-workspace',
      displayName: 'Test Workspace',
      chargingTarget: '12345678-1234-1234-1234-123456789abc',
      members: [],
    };

    // ACT
    const renderHookResult = renderHook(() => useCreateWorkspace('test-project--ns'));
    const { createWorkspace } = renderHookResult.result.current;

    // ASSERT
    await act(async () => {
      await expect(createWorkspace(mockWorkspaceData)).rejects.toThrow('API Error');
    });
  });
});
