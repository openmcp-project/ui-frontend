import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Handle the redirect from the IdP
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const state = params.get('state');
    const iss = params.get('iss');
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    if (error) {
      throw new Error(`Error from IdP: ${error} – ${errorDescription}`);
    }

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
  }, [location]);

  // Check the authentication status when the component mounts
  useEffect(() => {
    void checkAuthStatus();
  }, []);

  async function checkAuthStatus() {
    try {
      const response = await fetch('/api/auth/status');

      if (!response.ok) {
        throw new Error('Authentication check failed.');
      }

      const body = await response.json();
      setIsAuthenticated(body.isAuthenticated);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Authentication error.'));
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
      const response = await fetch('/api/auth/logout');

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      await checkAuthStatus();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Logout error.'));
    }
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, error, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
};
