import { createContext, useState, useEffect, ReactNode, use } from 'react';
import { MeResponseSchema } from './auth.schemas';
import { AUTH_FLOW_SESSION_KEY } from '../../../common/auth/AuthCallbackHandler.tsx';

interface AuthContextMcpType {
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  login: () => void;
}

const AuthContextMcp = createContext<AuthContextMcpType | null>(null);

export function AuthProviderMcp({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
      const response = await fetch('/api/auth/mcp/me');
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

      const { isAuthenticated: apiIsAuthenticated } = validationResult.data;
      setIsAuthenticated(apiIsAuthenticated);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Authentication error.'));
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }

  const login = () => {
    sessionStorage.setItem(AUTH_FLOW_SESSION_KEY, 'mcp');

    window.location.href = `/api/auth/mcp/login?redirectTo=${encodeURIComponent(window.location.hash)}`;
  };

  return (
    <AuthContextMcp value={{ isLoading, isAuthenticated, error, login }}>
      {children}
    </AuthContextMcp>
  );
}

export const useAuthMcp = () => {
  const context = use(AuthContextMcp);
  if (!context) {
    throw new Error('useAuthMcp must be used within an AuthProviderMcp.');
  }
  return context;
};
