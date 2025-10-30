import { act, renderHook } from '@testing-library/react';
import { useCreateWorkspace } from './useCreateWorkspace';
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

describe('useCreateWorkspace', () => {
  let fetchMock: Mock<typeof fetch>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
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

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({}),
    } as unknown as Response);

    // ACT
    const renderHookResult = renderHook(() => useCreateWorkspace('test-project', 'test-project--ns'));
    const { createWorkspace } = renderHookResult.result.current;

    await act(async () => {
      await createWorkspace(mockWorkspaceData);
    });

    // ASSERT
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const call = fetchMock.mock.calls[0];
    const [url, init] = call;
    assertNonNullish(init);
    const { method, headers, body } = init;

    expect(url).toContain('/api/onboarding/apis/core.openmcp.cloud/v1alpha1/namespaces/test-project--ns/workspaces');
    expect(method).toBe('POST');
    expect(headers).toEqual(
      expect.objectContaining({
        'Content-Type': 'application/json',
        'X-use-crate': 'true',
      }),
    );

    assertString(body);
    const parsedBody = JSON.parse(body);
    expect(parsedBody.metadata.name).toBe('test-workspace');
    expect(parsedBody.metadata.annotations?.['openmcp.cloud/display-name']).toBe('Test Workspace');
    expect(parsedBody.metadata.labels?.['openmcp.cloud.sap/charging-target']).toBe(
      '12345678-1234-1234-1234-123456789abc',
    );
    expect(parsedBody.spec.members).toHaveLength(1);
    expect(parsedBody.spec.members[0].name).toBe('user@domain.com');
  });

  it('should throw error on API failure', async () => {
    // ARRANGE
    fetchMock.mockRejectedValue(new Error('API Error'));

    const mockWorkspaceData = {
      name: 'test-workspace',
      displayName: 'Test Workspace',
      chargingTarget: '12345678-1234-1234-1234-123456789abc',
      members: [],
    };

    // ACT
    const renderHookResult = renderHook(() => useCreateWorkspace('test-project', 'test-project--ns'));
    const { createWorkspace } = renderHookResult.result.current;

    // ASSERT
    await act(async () => {
      await expect(createWorkspace(mockWorkspaceData)).rejects.toThrow('API Error');
    });
  });
});
