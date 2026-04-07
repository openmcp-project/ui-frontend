import { describe, it, expect, vi, beforeEach } from 'vitest';
import { redirectToLogin } from './redirectToLogin';
import { STORAGE_KEY_AUTH_FLOW } from './AuthCallbackHandler';

describe('redirectToLogin', () => {
  const replaceMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    vi.stubGlobal('location', { ...window.location, replace: replaceMock, search: '', hash: '' });
  });

  it('stores auth flow in sessionStorage', () => {
    redirectToLogin('onboarding');

    expect(sessionStorage.getItem(STORAGE_KEY_AUTH_FLOW)).toBe('onboarding');
  });

  it('redirects to onboarding login', () => {
    redirectToLogin('onboarding');

    expect(replaceMock).toHaveBeenCalledWith('/api/auth/onboarding/login?redirectTo=');
  });

  it('redirects to mcp login', () => {
    redirectToLogin('mcp');

    expect(sessionStorage.getItem(STORAGE_KEY_AUTH_FLOW)).toBe('mcp');
    expect(replaceMock).toHaveBeenCalledWith('/api/auth/mcp/login?redirectTo=');
  });

  it('includes current URL suffix in redirect', () => {
    vi.stubGlobal('location', { ...window.location, replace: replaceMock, search: '?theme=dark', hash: '#/projects' });

    redirectToLogin('onboarding');

    expect(replaceMock).toHaveBeenCalledWith(
      `/api/auth/onboarding/login?redirectTo=${encodeURIComponent('/?theme=dark#/projects')}`,
    );
  });
});
