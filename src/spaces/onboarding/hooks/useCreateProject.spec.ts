import { act, renderHook } from '@testing-library/react';
import { useCreateProject } from './useCreateProject';
import { describe, it, expect, vi, afterEach, Mock, beforeEach } from 'vitest';
import { useMutation } from '@apollo/client/react';
import { MemberRoles } from '../../../lib/api/types/shared/members';

vi.mock('../../../context/ToastContext', () => ({
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

describe('useCreateProject', () => {
  let mutateMock: Mock;
  const useMutationMock = vi.mocked(useMutation);

  beforeEach(() => {
    mutateMock = vi.fn();
    useMutationMock.mockReturnValue([mutateMock] as unknown as ReturnType<typeof useMutation>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should perform a valid create project request', async () => {
    const mockProjectData = {
      name: 'test-project',
      displayName: 'Test Project',
      chargingTarget: '12345678-1234-1234-1234-123456789abc',
      chargingTargetType: 'btp',
      members: [
        {
          name: 'user@domain.com',
          roles: [MemberRoles.admin],
          kind: 'User' as const,
        },
      ],
    };

    mutateMock.mockResolvedValue({});

    const renderHookResult = renderHook(() => useCreateProject());
    const { createProject } = renderHookResult.result.current;

    await act(async () => {
      await createProject(mockProjectData);
    });

    expect(mutateMock).toHaveBeenCalledTimes(1);

    const call = mutateMock.mock.calls[0][0];
    const { variables } = call;
    expect(variables.object.metadata.name).toBe('test-project');
    expect(variables.object.metadata.annotations?.['openmcp.cloud/display-name']).toBe('Test Project');
    expect(variables.object.metadata.labels?.['openmcp.cloud.sap/charging-target']).toBe(
      '12345678-1234-1234-1234-123456789abc',
    );
    expect(variables.object.spec.members).toHaveLength(1);
    expect(variables.object.spec.members[0].name).toBe('user@domain.com');
  });

  it('should throw error on API failure', async () => {
    mutateMock.mockRejectedValue(new Error('API Error'));

    const mockProjectData = {
      name: 'test-project',
      displayName: 'Test Project',
      chargingTarget: '12345678-1234-1234-1234-123456789abc',
      chargingTargetType: 'btp',
      members: [],
    };

    const renderHookResult = renderHook(() => useCreateProject());
    const { createProject } = renderHookResult.result.current;

    await act(async () => {
      await expect(createProject(mockProjectData)).rejects.toThrow('API Error');
    });
  });
});
