import { ApplicationError, type ApplicationErrorLogLevel } from '../errors.js';

type ExpectedAuthStatus = 400 | 401 | 403 | 404;

interface ExpectedAuthErrorOptions {
  code: string;
  statusCode: ExpectedAuthStatus;
  publicMessage: string;
  logLevel?: Exclude<ApplicationErrorLogLevel, 'error'>;
  context?: Readonly<Record<string, unknown>>;
  cause?: unknown;
}

export class ExpectedAuthError extends ApplicationError {
  constructor(message: string, options: ExpectedAuthErrorOptions) {
    super(message, {
      ...options,
      logLevel: options.logLevel ?? 'info',
      report: false,
    });
  }
}

interface AuthUpstreamErrorOptions {
  code: string;
  statusCode?: 502 | 503 | 504;
  publicMessage?: string;
  context?: Readonly<Record<string, unknown>>;
  cause?: unknown;
}

export class AuthUpstreamError extends ApplicationError {
  constructor(message: string, options: AuthUpstreamErrorOptions) {
    super(message, {
      ...options,
      statusCode: options.statusCode ?? 502,
      publicMessage: options.publicMessage ?? 'Authentication service temporarily unavailable.',
      logLevel: 'error',
      report: true,
    });
  }
}

interface AuthConfigurationErrorOptions {
  code: string;
  publicMessage?: string;
  context?: Readonly<Record<string, unknown>>;
  cause?: unknown;
}

export class AuthConfigurationError extends ApplicationError {
  constructor(message: string, options: AuthConfigurationErrorOptions) {
    super(message, {
      ...options,
      statusCode: 500,
      publicMessage: options.publicMessage ?? 'Authentication is not configured correctly.',
      logLevel: 'error',
      report: true,
    });
  }
}

export type OAuthOperation = 'refresh' | 'token_exchange';

const parseOAuthErrorCode = (responseBody: string): string | undefined => {
  try {
    const parsed = JSON.parse(responseBody) as unknown;
    if (typeof parsed === 'object' && parsed !== null && 'error' in parsed && typeof parsed.error === 'string') {
      return parsed.error;
    }
  } catch {
    // A non-JSON response is classified as an invalid upstream response below.
  }
  return undefined;
};

export const createOAuthEndpointError = (
  operation: OAuthOperation,
  upstreamStatus: number,
  responseBody: string,
): ApplicationError => {
  const oauthError = parseOAuthErrorCode(responseBody);
  const context = {
    operation,
    upstreamStatus,
    ...(oauthError !== undefined && { oauthError }),
  };

  if (oauthError === 'invalid_grant') {
    return new ExpectedAuthError(`OAuth ${operation} was rejected with invalid_grant.`, {
      code: operation === 'refresh' ? 'session_expired' : 'authorization_code_rejected',
      statusCode: 401,
      publicMessage: operation === 'refresh' ? 'Session expired.' : 'Authentication could not be completed.',
      context,
    });
  }

  if (oauthError === 'access_denied') {
    return new ExpectedAuthError('OAuth authorization was denied.', {
      code: operation === 'refresh' ? 'session_expired' : 'authorization_denied',
      statusCode: 401,
      publicMessage: operation === 'refresh' ? 'Session expired.' : 'Authentication was denied.',
      context,
    });
  }

  if (oauthError === 'invalid_client' || oauthError === 'unauthorized_client') {
    return new AuthConfigurationError(`OAuth ${operation} failed because the client was rejected.`, {
      code: 'oauth_client_rejected',
      context,
    });
  }

  if (upstreamStatus === 429) {
    return new AuthUpstreamError(`OAuth ${operation} was rate limited by the identity provider.`, {
      code: 'oauth_upstream_rate_limited',
      statusCode: 503,
      context,
    });
  }

  return new AuthUpstreamError(`OAuth ${operation} failed with an unexpected identity-provider response.`, {
    code: 'oauth_upstream_rejected',
    statusCode: 502,
    context,
  });
};

export const createOAuthAuthorizationError = (oauthError: string): ApplicationError => {
  const context = { operation: 'authorization', oauthError };

  if (['access_denied', 'login_required', 'consent_required', 'interaction_required'].includes(oauthError)) {
    return new ExpectedAuthError('OIDC authorization was not completed.', {
      code: 'authorization_denied',
      statusCode: 401,
      publicMessage: 'Authentication was not completed.',
      context,
    });
  }

  if (oauthError === 'server_error' || oauthError === 'temporarily_unavailable') {
    return new AuthUpstreamError('OIDC authorization provider reported a temporary failure.', {
      code: 'oauth_authorization_upstream_failure',
      statusCode: 502,
      context,
    });
  }

  return new AuthConfigurationError('OIDC authorization request was rejected.', {
    code: 'oauth_authorization_configuration_failure',
    context,
  });
};

export const createMcpConfigurationFetchError = (upstreamStatus: number): ApplicationError => {
  const context = { upstreamStatus };

  if (upstreamStatus === 401) {
    return new ExpectedAuthError('MCP configuration request was unauthorized.', {
      code: 'mcp_configuration_unauthorized',
      statusCode: 401,
      publicMessage: 'Authentication required.',
      context,
    });
  }

  if (upstreamStatus === 403) {
    return new ExpectedAuthError('MCP configuration request was forbidden.', {
      code: 'mcp_configuration_forbidden',
      statusCode: 403,
      publicMessage: 'Access to MCP configuration denied.',
      logLevel: 'warn',
      context,
    });
  }

  if (upstreamStatus === 404) {
    return new ExpectedAuthError('MCP configuration was not found.', {
      code: 'mcp_configuration_not_found',
      statusCode: 404,
      publicMessage: 'MCP configuration not found.',
      context,
    });
  }

  return new AuthUpstreamError('Could not load MCP configuration.', {
    code: upstreamStatus === 429 ? 'mcp_configuration_rate_limited' : 'mcp_configuration_upstream_failure',
    statusCode: upstreamStatus === 429 ? 503 : 502,
    publicMessage: 'Unable to load MCP configuration.',
    context,
  });
};

export const isExpiredSessionError = (error: unknown): error is ExpectedAuthError => {
  return error instanceof ExpectedAuthError && error.code === 'session_expired';
};
