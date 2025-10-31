import { act, renderHook } from '@testing-library/react';
import { useCreateProject } from './useCreateProject';
import { describe, it, expect, vi, afterEach, Mock, beforeEach } from 'vitest';
import { assertNonNullish, assertString } from '../utils/test/vitest-utils';
import { MemberRoles } from '../lib/api/types/shared/members';

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

describe('useCreateProject', () => {
  let fetchMock: Mock<typeof fetch>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should perform a valid create project request', async () => {
    // ARRANGE
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

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({}),
    } as unknown as Response);

    // ACT
    const renderHookResult = renderHook(() => useCreateProject());
    const { createProject } = renderHookResult.result.current;

    await act(async () => {
      await createProject(mockProjectData);
    });

    // ASSERT
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const call = fetchMock.mock.calls[0];
    const [url, init] = call;
    assertNonNullish(init);
    const { method, headers, body } = init;

    expect(url).toContain('/api/onboarding/apis/core.openmcp.cloud/v1alpha1/projects');
    expect(method).toBe('POST');
    expect(headers).toEqual(
      expect.objectContaining({
        'Content-Type': 'application/json',
        'X-use-crate': 'true',
      }),
    );

    assertString(body);
    const parsedBody = JSON.parse(body);
    expect(parsedBody.metadata.name).toBe('test-project');
    expect(parsedBody.metadata.annotations?.['openmcp.cloud/display-name']).toBe('Test Project');
    expect(parsedBody.metadata.labels?.['openmcp.cloud.sap/charging-target']).toBe(
      '12345678-1234-1234-1234-123456789abc',
    );
    expect(parsedBody.spec.members).toHaveLength(1);
    expect(parsedBody.spec.members[0].name).toBe('user@domain.com');
  });

  it('should throw error on API failure', async () => {
    // ARRANGE
    fetchMock.mockRejectedValue(new Error('API Error'));

    const mockProjectData = {
      name: 'test-project',
      displayName: 'Test Project',
      chargingTarget: '12345678-1234-1234-1234-123456789abc',
      chargingTargetType: 'btp',
      members: [],
    };

    // ACT
    const renderHookResult = renderHook(() => useCreateProject());
    const { createProject } = renderHookResult.result.current;

    // ASSERT
    await act(async () => {
      await expect(createProject(mockProjectData)).rejects.toThrow('API Error');
    });
  });
});
