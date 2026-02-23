import { createContext, useState, useEffect, ReactNode, use, useCallback } from 'react';
import { MeResponseSchema, User } from './auth.schemas';
import { STORAGE_KEY_AUTH_FLOW } from '../../../common/auth/AuthCallbackHandler.tsx';
import * as Sentry from '@sentry/react';
import { getRedirectSuffix } from '../../../common/auth/getRedirectSuffix.ts';

interface AuthContextOnboardingType {
  isPending: boolean;
  isAuthenticated: boolean;
  user: User | null;
  error: Error | null;
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContextOnboarding = createContext<AuthContextOnboardingType | null>(null);

const REFRESH_BUFFER_MS = 55 * 1000; // 55 seconds buffer before token expiry to trigger refresh

export function AuthProviderOnboarding({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tokenExpiry, setTokenExpiry] = useState<number | null>(null);

  const refreshAuthStatus = useCallback(async (isBackground: boolean) => {
    // Only show loading spinner for user-initiated auth checks, not background token refreshes
    if (!isBackground) {
      setIsPending(true);
    }
    setError(null);

    try {
      const response = await fetch('/api/auth/onboarding/me');
      if (!response.ok) {
        let errorBody;
        try {
          errorBody = await response.json();
        } catch (_error) {
          /* safe to ignore */
        }
        throw new Error(errorBody?.message || `Authentication check failed with status: ${response.status}`);
      }

      const body = await response.json();
      const validationResult = MeResponseSchema.safeParse(body);
      if (!validationResult.success) {
        throw new Error(`Auth API response validation failed: ${validationResult.error.flatten()}`);
      }

      const {
        isAuthenticated: apiIsAuthenticated,
        user: apiUser,
        tokenExpiresAt: apiTokenExpiresAt,
      } = validationResult.data;
      setUser(apiUser);
      setIsAuthenticated(apiIsAuthenticated);
      setTokenExpiry(apiTokenExpiresAt);

      Sentry.addBreadcrumb({
        category: 'auth',
        message: 'Authenticated user ' + apiUser?.email,
        level: 'info',
      });
    } catch (err) {
      Sentry.captureException(err, {
        extra: {
          context: 'AuthContextOnboarding:refreshAuthStatus',
          path: '/api/auth/onboarding/me',
          method: 'GET',
        },
      });
      setError(err instanceof Error ? err : new Error('Authentication error.'));
      setUser(null);
      setIsAuthenticated(false);
      setTokenExpiry(null);
    } finally {
      setIsPending(false);
    }
  }, []);

  // Check the authentication status when the component mounts
  useEffect(() => {
    void refreshAuthStatus(false);
  }, [refreshAuthStatus]);

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/onboarding/refresh', { method: 'POST' });
      if (response.ok) {
        await refreshAuthStatus(true);
      } else {
        if (response.status === 401) {
          setIsAuthenticated(false);
          setUser(null);
          setTokenExpiry(null);
        }
        const error = new Error('Failed to refresh authentication token');
        setError(error);
        Sentry.captureException(error, {
          extra: { status: response.status, context: 'AuthContextOnboarding:refreshSession' },
        });
      }
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Network error during token refresh'));
      Sentry.captureException(error, {
        extra: { context: 'AuthContextOnboarding:refreshSession' },
      });
    }
  }, [refreshAuthStatus]);

  // Effect to manage the refresh timer
  useEffect(() => {
    if (!tokenExpiry || !isAuthenticated) return;

    // Refresh before actual expiry to account for clock skew and network delays
    const expiresAt = new Date(tokenExpiry).getTime();
    const now = Date.now();
    const delay = expiresAt - now - REFRESH_BUFFER_MS;

    if (delay <= 0) {
      void refreshSession();
      return;
    }

    const timerId = setTimeout(refreshSession, delay);

    return () => clearTimeout(timerId);
  }, [tokenExpiry, isAuthenticated, refreshSession]);

  const login = () => {
    sessionStorage.setItem(STORAGE_KEY_AUTH_FLOW, 'onboarding');
    window.location.replace(`/api/auth/onboarding/login?redirectTo=${encodeURIComponent(getRedirectSuffix())}`);
  };

  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        let errorBody;
        try {
          errorBody = await response.json();
        } catch (_error) {
          /* safe to ignore */
        }
        throw new Error(errorBody?.message || `Logout failed with status: ${response.status}`);
      }

      await refreshAuthStatus(false);
    } catch (err) {
      Sentry.captureException(err, {
        extra: {
          context: 'AuthContextOnboarding:logout',
          path: '/api/auth/logout',
          method: 'POST',
        },
      });
      setError(err instanceof Error ? err : new Error('Logout error.'));
    }
  };

  return (
    <AuthContextOnboarding value={{ isPending, isAuthenticated, user, error, login, logout }}>
      {children}
    </AuthContextOnboarding>
  );
}

export const useAuthOnboarding = () => {
  const context = use(AuthContextOnboarding);
  if (!context) {
    throw new Error('useAuthOnboarding must be used within an AuthProviderOnboarding.');
  }
  return context;
};
