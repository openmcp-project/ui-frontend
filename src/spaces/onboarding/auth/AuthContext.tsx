import { createContext, useState, useEffect, ReactNode, use } from 'react';
import { MeResponseSchema, User } from './auth.schemas';

interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  error: Error | null;
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Handle the redirect from the IdP
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const state = params.get('state');
    const iss = params.get('iss');

    if (code && state) {
      // Construct the URL to forward to the BFF
      const forwardUrl = new URL('/api/auth/callback', window.location.origin);
      forwardUrl.searchParams.append('code', code);
      forwardUrl.searchParams.append('state', state);
      if (iss) {
        forwardUrl.searchParams.append('iss', iss);
      }
      window.location.href = forwardUrl.toString();
    }
  }, []);

  // Check the authentication status when the component mounts
  useEffect(() => {
    // Only run checkAuthStatus if not currently handling a redirect
    const params = new URLSearchParams(window.location.search);
    if (!params.has('code') && !params.has('error')) {
      void refreshAuthStatus();
    }
  }, []);

  async function refreshAuthStatus() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        let errorBody;
        try {
          errorBody = await response.json();
        } catch (_) {
          /* safe to ignore */
        }
        throw new Error(
          errorBody?.message ||
            `Authentication check failed with status: ${response.status}`,
        );
      }

      const body = await response.json();
      const validationResult = MeResponseSchema.safeParse(body);
      if (!validationResult.success) {
        throw new Error(
          `Auth API response validation failed: ${validationResult.error.flatten()}`,
        );
      }

      const { isAuthenticated: apiIsAuthenticated, user: apiUser } =
        validationResult.data;
      setUser(apiUser);
      setIsAuthenticated(apiIsAuthenticated);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Authentication error.'));
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }

  const login = () => {
    window.location.href = `/api/auth/login`;
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
        throw new Error(
          errorBody?.message || `Logout failed with status: ${response.status}`,
        );
      }

      await refreshAuthStatus();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Logout error.'));
    }
  };

  return (
    <AuthContext
      value={{ isLoading, isAuthenticated, user, error, login, logout }}
    >
      {children}
    </AuthContext>
  );
}

export const useAuth = () => {
  const context = use(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
};
