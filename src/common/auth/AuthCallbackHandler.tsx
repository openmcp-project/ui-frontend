import { ReactNode, useEffect } from 'react';
import { BusyIndicator } from '@ui5/webcomponents-react';

const REDIRECT_TARGETS = {
  onboarding: '/api/auth/onboarding/callback',
  mcp: '/api/auth/mcp/callback',
} as const;

type AuthFlow = keyof typeof REDIRECT_TARGETS;

function isAuthFlow(value: unknown): value is AuthFlow {
  if (typeof value !== 'string') {
    return false;
  }
  return Object.keys(REDIRECT_TARGETS).includes(value);
}

export const AUTH_FLOW_SESSION_KEY = 'auth:post-callback-flow';

function useAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const iss = params.get('iss');

  const potentialAuthFlow = sessionStorage.getItem(AUTH_FLOW_SESSION_KEY);

  const isCallbackInProgress = !!(code && state && potentialAuthFlow);

  useEffect(() => {
    if (!isCallbackInProgress) {
      return;
    }

    if (!isAuthFlow(potentialAuthFlow)) {
      throw new Error(
        `Unknown authFlow '${potentialAuthFlow}'. Should be typeof '${Object.keys(REDIRECT_TARGETS).join(' | ')}'`,
      );
    }
    const redirectTarget = REDIRECT_TARGETS[potentialAuthFlow];

    const forwardUrl = new URL(redirectTarget, window.location.origin);
    forwardUrl.searchParams.append('code', code);
    forwardUrl.searchParams.append('state', state);
    if (iss) {
      forwardUrl.searchParams.append('iss', iss);
    }

    sessionStorage.removeItem(AUTH_FLOW_SESSION_KEY);
    window.location.replace(forwardUrl.toString());
  }, [isCallbackInProgress, potentialAuthFlow, code, state, iss]);

  return {
    isLoading: isCallbackInProgress,
  };
}

export interface AuthCallbackHandlerProps {
  children?: ReactNode;
}

/**
 * This component centrally handles client-side redirects from external identity providers after user authentication.
 * It forwards temporary credentials (e.g.,`code`,`state`) to the backend API endpoint,
 * whose URL was previously and temporarily stored in `sessionStorage`.
 */
export function AuthCallbackHandler({ children }: AuthCallbackHandlerProps) {
  const { isLoading } = useAuthCallback();

  // The component remains clean and focused on rendering.
  return <>{isLoading ? <BusyIndicator active /> : children}</>;
}
