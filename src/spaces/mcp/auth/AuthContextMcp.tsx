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

  const { projectName, workspaceName, controlPlaneName } = useParams();
  const [searchParams] = useSearchParams();
  const idpName = searchParams.get('idp');
  const namespace = `project-${projectName}--ws-${workspaceName}`;

  const refreshAuthStatus = useCallback(async () => {
    setIsLoading(true);
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

      const { isAuthenticated: apiIsAuthenticated } = validationResult.data;
      setIsAuthenticated(apiIsAuthenticated);
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
    } finally {
      setIsLoading(false);
    }
  }, [projectName, workspaceName, controlPlaneName, idpName, namespace]);

  // Check the authentication status when the component mounts
  useEffect(() => {
    void refreshAuthStatus();
  }, [refreshAuthStatus]);

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

  return <AuthContextMcp value={{ isLoading, isAuthenticated, error, login }}>{children}</AuthContextMcp>;
}

export const useAuthMcp = () => {
  const context = use(AuthContextMcp);
  if (!context) {
    throw new Error('useAuthMcp must be used within an AuthProviderMcp.');
  }
  return context;
};
