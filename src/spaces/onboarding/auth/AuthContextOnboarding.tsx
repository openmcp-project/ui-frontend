import { createContext, useState, useEffect, ReactNode, use } from 'react';
import { MeResponseSchema, User } from './auth.schemas';
import { AUTH_FLOW_SESSION_KEY } from '../../../common/auth/AuthCallbackHandler.tsx';
import * as Sentry from '@sentry/react';

interface AuthContextOnboardingType {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  error: Error | null;
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContextOnboarding = createContext<AuthContextOnboardingType | null>(null);

export function AuthProviderOnboarding({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Check the authentication status when the component mounts
  useEffect(() => {
    void refreshAuthStatus();
  }, []);

  async function refreshAuthStatus() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/onboarding/me');
      if (!response.ok) {
        let errorBody;
        try {
          errorBody = await response.json();
        } catch (_) {
          /* safe to ignore */
        }
        throw new Error(errorBody?.message || `Authentication check failed with status: ${response.status}`);
      }

      const body = await response.json();
      const validationResult = MeResponseSchema.safeParse(body);
      if (!validationResult.success) {
        throw new Error(`Auth API response validation failed: ${validationResult.error.flatten()}`);
      }

      const { isAuthenticated: apiIsAuthenticated, user: apiUser } = validationResult.data;
      setUser(apiUser);
      setIsAuthenticated(apiIsAuthenticated);

      Sentry.addBreadcrumb({
        category: 'auth',
        message: 'Authenticated user ' + apiUser?.email,
        level: 'info',
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Authentication error.'));
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }

  const login = () => {
    sessionStorage.setItem(AUTH_FLOW_SESSION_KEY, 'onboarding');

    window.location.replace(`/api/auth/onboarding/login?redirectTo=${encodeURIComponent(window.location.hash)}`);
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
        } catch (_) {
          /* safe to ignore */
        }
        throw new Error(errorBody?.message || `Logout failed with status: ${response.status}`);
      }

      await refreshAuthStatus();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Logout error.'));
    }
  };

  return (
    <AuthContextOnboarding value={{ isLoading, isAuthenticated, user, error, login, logout }}>
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
