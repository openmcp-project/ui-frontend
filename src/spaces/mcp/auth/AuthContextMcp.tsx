import { createContext, useState, useEffect, ReactNode, use, useCallback } from 'react';
import * as Sentry from '@sentry/react';
import { MeResponseSchema } from './auth.schemas';
import {
  STORAGE_KEY_AUTH_IDP,
  STORAGE_KEY_AUTH_MCP,
  STORAGE_KEY_AUTH_NAMESPACE,
  STORAGE_KEY_AUTH_FLOW,
} from '../../../common/auth/AuthCallbackHandler.tsx';
import { getRedirectSuffix } from '../../../common/auth/getRedirectSuffix.ts';
import { useParams, useSearchParams } from 'react-router-dom';

interface AuthContextMcpType {
  isPending: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  login: () => void;
}

const AuthContextMcp = createContext<AuthContextMcpType | null>(null);

const REFRESH_BUFFER_MS = 55 * 1000; // 55 seconds buffer before token expiry to trigger refresh

export function AuthProviderMcp({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tokenExpiry, setTokenExpiry] = useState<number | null>(null);

  const { projectName, workspaceName, controlPlaneName } = useParams();
  const [searchParams] = useSearchParams();
  const idpName = searchParams.get('idp');
  const namespace = `project-${projectName}--ws-${workspaceName}`;

  const refreshAuthStatus = useCallback(
    async (isBackground: boolean) => {
      if (!isBackground) {
        setIsPending(true);
      }
      setError(null);

      const queryParams = new URLSearchParams();
      if (projectName && workspaceName && controlPlaneName && idpName) {
        // Custom identity provider
        queryParams.set('namespace', namespace);
        queryParams.set('mcp', controlPlaneName);
        queryParams.set('idp', idpName);
      }
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

      try {
        const response = await fetch(`/api/auth/mcp/me${queryString}`, {
          method: 'GET',
        });
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

        const { isAuthenticated: apiIsAuthenticated, tokenExpiresAt: apiTokenExpiresAt } = validationResult.data;
        setIsAuthenticated(apiIsAuthenticated);
        setTokenExpiry(apiTokenExpiresAt);
      } catch (err) {
        Sentry.captureException(err, {
          extra: {
            context: 'AuthContextMcp',
            path: '/api/auth/mcp/me',
            method: 'GET',
          },
        });
        setError(err instanceof Error ? err : new Error('Authentication error.'));
        setIsAuthenticated(false);
        setTokenExpiry(null);
      } finally {
        setIsPending(false);
      }
    },
    [projectName, workspaceName, controlPlaneName, idpName, namespace],
  );

  // Check the authentication status when the component mounts
  useEffect(() => {
    void refreshAuthStatus(false);
  }, [refreshAuthStatus]);

  const refreshSession = useCallback(async () => {
    const queryParams = new URLSearchParams();
    if (projectName && workspaceName && controlPlaneName && idpName) {
      // Custom identity provider
      queryParams.set('namespace', namespace);
      queryParams.set('mcp', controlPlaneName);
      queryParams.set('idp', idpName);
    }
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    try {
      const response = await fetch(`/api/auth/mcp/refresh${queryString}`, { method: 'POST' });
      if (response.ok) {
        await refreshAuthStatus(true);
      } else {
        Sentry.captureException(new Error('MCP token refresh failed'), {
          extra: { status: response.status, context: 'AuthContextMcp:refreshSession' },
        });
      }
    } catch (error) {
      Sentry.captureException(error, {
        extra: { context: 'AuthContextMcp:refreshSession' },
      });
    }
  }, [projectName, workspaceName, controlPlaneName, idpName, namespace, refreshAuthStatus]);

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
    sessionStorage.setItem(STORAGE_KEY_AUTH_FLOW, 'mcp');

    let additionalQuery = '';
    if (namespace && controlPlaneName && idpName) {
      // Pass details for custom identity provider and save them for the callback handler
      sessionStorage.setItem(STORAGE_KEY_AUTH_NAMESPACE, namespace);
      sessionStorage.setItem(STORAGE_KEY_AUTH_MCP, controlPlaneName);
      sessionStorage.setItem(STORAGE_KEY_AUTH_IDP, idpName);

      const queryParams = new URLSearchParams({
        namespace: namespace,
        mcp: controlPlaneName,
        idp: idpName,
      });
      additionalQuery = `&${queryParams.toString()}`;
    } else {
      sessionStorage.removeItem(STORAGE_KEY_AUTH_NAMESPACE);
      sessionStorage.removeItem(STORAGE_KEY_AUTH_MCP);
      sessionStorage.removeItem(STORAGE_KEY_AUTH_IDP);
    }

    window.location.replace(
      `/api/auth/mcp/login?redirectTo=${encodeURIComponent(getRedirectSuffix())}${additionalQuery}`,
    );
  };

  return <AuthContextMcp value={{ isPending, isAuthenticated, error, login }}>{children}</AuthContextMcp>;
}

export const useAuthMcp = () => {
  const context = use(AuthContextMcp);
  if (!context) {
    throw new Error('useAuthMcp must be used within an AuthProviderMcp.');
  }
  return context;
};
