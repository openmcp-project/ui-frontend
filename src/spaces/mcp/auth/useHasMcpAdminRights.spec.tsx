import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHasMcpAdminRights } from './useHasMcpAdminRights.ts';
import { useAuthOnboarding } from '../../onboarding/auth/AuthContextOnboarding.tsx';
import { useMcp } from '../../../lib/shared/McpContext.tsx';
import type { RoleBinding } from '../../../lib/api/types/crate/controlPlanes.ts';

vi.mock('../../onboarding/auth/AuthContextOnboarding.tsx');
vi.mock('../../../lib/shared/McpContext.tsx');

const mockedUseAuthOnboarding = vi.mocked(useAuthOnboarding);
const mockedUseMcp = vi.mocked(useMcp);

// Helper function to create mock auth context
const mockAuth = (userEmail: string | null | undefined) => {
  mockedUseAuthOnboarding.mockReturnValue({
    user: userEmail !== null && userEmail !== undefined ? ({ email: userEmail } as any) : null,
    isLoading: false,
    isAuthenticated: userEmail !== null,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
  });
};

// Helper function to create mock MCP context
const mockMcp = (roleBindings?: RoleBinding[]) => {
  mockedUseMcp.mockReturnValue({
    project: 'test-project',
    workspace: 'test-workspace',
    name: 'test-mcp',
    roleBindings,
  });
};

describe('useHasMcpAdminRights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false when there is no authenticated user', () => {
    mockAuth(null);
    mockMcp([]);

    const { result } = renderHook(() => useHasMcpAdminRights());

    expect(result.current).toBe(false);
  });

  it('returns false when user email is missing', () => {
    mockAuth(undefined);
    mockMcp([]);

    const { result } = renderHook(() => useHasMcpAdminRights());

    expect(result.current).toBe(false);
  });

  it('returns false when roleBindings is undefined', () => {
    mockAuth('user@example.com');
    mockMcp(undefined);

    const { result } = renderHook(() => useHasMcpAdminRights());

    expect(result.current).toBe(false);
  });

  it('returns false when roleBindings is empty', () => {
    mockAuth('user@example.com');
    mockMcp([]);

    const { result } = renderHook(() => useHasMcpAdminRights());

    expect(result.current).toBe(false);
  });

  it('returns false when there is no matching role binding', () => {
    mockAuth('user@example.com');
    mockMcp([
      {
        subjects: [{ kind: 'User', name: 'other@example.com' }],
        role: 'admin',
      },
    ]);

    const { result } = renderHook(() => useHasMcpAdminRights());

    expect(result.current).toBe(false);
  });

  it('returns false when matching role binding does not have admin role', () => {
    mockAuth('user@example.com');
    mockMcp([
      {
        subjects: [{ kind: 'User', name: 'user@example.com' }],
        role: 'viewer',
      },
    ]);

    const { result } = renderHook(() => useHasMcpAdminRights());

    expect(result.current).toBe(false);
  });

  it('returns true when matching role binding has admin role', () => {
    mockAuth('user@example.com');
    mockMcp([
      {
        subjects: [{ kind: 'User', name: 'user@example.com' }],
        role: 'admin',
      },
    ]);

    const { result } = renderHook(() => useHasMcpAdminRights());

    expect(result.current).toBe(true);
  });

  it('uses partial match on subject name for email', () => {
    mockAuth('user@example.com');
    mockMcp([
      {
        subjects: [{ kind: 'User', name: 'prefix-user@example.com-suffix' }],
        role: 'admin',
      },
    ]);

    const { result } = renderHook(() => useHasMcpAdminRights());

    expect(result.current).toBe(true);
  });

  it('handles missing subjects array safely', () => {
    mockAuth('user@example.com');
    mockMcp([
      {
        subjects: undefined as any,
        role: 'admin',
      },
    ]);

    const { result } = renderHook(() => useHasMcpAdminRights());

    expect(result.current).toBe(false);
  });

  it('returns false when user has viewer role before admin role (find returns first match)', () => {
    mockAuth('user@example.com');
    mockMcp([
      {
        subjects: [{ kind: 'User', name: 'other@example.com' }],
        role: 'admin',
      },
      {
        subjects: [{ kind: 'User', name: 'user@example.com' }],
        role: 'viewer',
      },
      {
        subjects: [{ kind: 'User', name: 'user@example.com' }],
        role: 'admin',
      },
    ]);

    const { result } = renderHook(() => useHasMcpAdminRights());

    // Returns false because .find() stops at the first matching role binding (viewer)
    expect(result.current).toBe(false);
  });

  it('returns true when user has admin role as first matching binding', () => {
    mockAuth('user@example.com');
    mockMcp([
      {
        subjects: [{ kind: 'User', name: 'other@example.com' }],
        role: 'viewer',
      },
      {
        subjects: [{ kind: 'User', name: 'user@example.com' }],
        role: 'admin',
      },
      {
        subjects: [{ kind: 'User', name: 'user@example.com' }],
        role: 'viewer',
      },
    ]);

    const { result } = renderHook(() => useHasMcpAdminRights());

    expect(result.current).toBe(true);
  });

  it('handles multiple subjects in a single role binding', () => {
    mockAuth('user@example.com');
    mockMcp([
      {
        subjects: [
          { kind: 'User', name: 'other@example.com' },
          { kind: 'User', name: 'user@example.com' },
          { kind: 'User', name: 'another@example.com' },
        ],
        role: 'admin',
      },
    ]);

    const { result } = renderHook(() => useHasMcpAdminRights());

    expect(result.current).toBe(true);
  });

  it('handles null subject name safely', () => {
    mockAuth('user@example.com');
    mockMcp([
      {
        subjects: [{ kind: 'User', name: null as any }],
        role: 'admin',
      },
    ]);

    const { result } = renderHook(() => useHasMcpAdminRights());

    expect(result.current).toBe(false);
  });
});
