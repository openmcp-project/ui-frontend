import fp from 'fastify-plugin';
import crypto from 'node:crypto';
import {
  AuthConfigurationError,
  AuthUpstreamError,
  ExpectedAuthError,
  createOAuthAuthorizationError,
  createOAuthEndpointError,
  type OAuthOperation,
} from '../auth/errors.js';

interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  id_token?: string;
}

async function getRemoteOpenIdConfiguration(issuerBaseUrl: string) {
  let url: string;
  try {
    url = new URL('/.well-known/openid-configuration', issuerBaseUrl).toString();
  } catch (cause) {
    throw new AuthConfigurationError('OIDC issuer URL is invalid.', {
      code: 'invalid_oidc_issuer',
      context: { issuer: issuerBaseUrl },
      cause,
    });
  }

  let res: Response;
  try {
    res = await fetch(url);
  } catch (cause) {
    throw new AuthUpstreamError('OIDC discovery endpoint is unavailable.', {
      code: 'oidc_discovery_unavailable',
      statusCode: 503,
      context: { issuer: issuerBaseUrl },
      cause,
    });
  }

  if (!res.ok) {
    const context = { issuer: issuerBaseUrl, upstreamStatus: res.status };
    if (res.status === 429 || res.status >= 500) {
      throw new AuthUpstreamError(`OIDC discovery failed with status ${res.status}.`, {
        code: res.status === 429 ? 'oidc_discovery_rate_limited' : 'oidc_discovery_upstream_failure',
        statusCode: res.status === 429 ? 503 : 502,
        context,
      });
    }
    throw new AuthConfigurationError(`OIDC discovery was rejected with status ${res.status}.`, {
      code: 'oidc_discovery_rejected',
      context,
    });
  }

  let remoteConfiguration: unknown;
  try {
    remoteConfiguration = await res.json();
  } catch (cause) {
    throw new AuthUpstreamError('OIDC discovery returned invalid JSON.', {
      code: 'invalid_oidc_discovery_response',
      context: { issuer: issuerBaseUrl, upstreamStatus: res.status },
      cause,
    });
  }

  if (
    typeof remoteConfiguration !== 'object' ||
    remoteConfiguration === null ||
    !('authorization_endpoint' in remoteConfiguration) ||
    typeof remoteConfiguration.authorization_endpoint !== 'string' ||
    !('token_endpoint' in remoteConfiguration) ||
    typeof remoteConfiguration.token_endpoint !== 'string'
  ) {
    throw new AuthUpstreamError('OIDC discovery response is missing required endpoints.', {
      code: 'invalid_oidc_discovery_response',
      context: { issuer: issuerBaseUrl, upstreamStatus: res.status },
    });
  }

  return {
    authorizationEndpoint: remoteConfiguration.authorization_endpoint,
    tokenEndpoint: remoteConfiguration.token_endpoint,
  };
}

const readOAuthResponseBody = async (response: Response, operation: OAuthOperation): Promise<string> => {
  try {
    return await response.text();
  } catch (cause) {
    throw new AuthUpstreamError(`Could not read OAuth ${operation} response.`, {
      code: 'unreadable_oauth_response',
      context: { operation, upstreamStatus: response.status },
      cause,
    });
  }
};

const parseOAuthTokenResponse = (
  responseBody: string,
  operation: OAuthOperation,
  upstreamStatus: number,
): OAuthTokenResponse => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(responseBody);
  } catch (cause) {
    throw new AuthUpstreamError(`OAuth ${operation} returned invalid JSON.`, {
      code: 'invalid_oauth_response',
      context: { operation, upstreamStatus },
      cause,
    });
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('access_token' in parsed) ||
    typeof parsed.access_token !== 'string' ||
    parsed.access_token.length === 0
  ) {
    throw new AuthUpstreamError(`OAuth ${operation} response is missing an access token.`, {
      code: 'invalid_oauth_response',
      context: { operation, upstreamStatus },
    });
  }

  return parsed as unknown as OAuthTokenResponse;
};

// @ts-ignore
function isAllowedRedirectTo(value) {
  if (!value) return true;
  const first = value.charAt(0);
  return first === '/' || first === '#';
}

// @ts-ignore
async function authUtilsPlugin(fastify) {
  fastify.decorate('discoverIssuerConfiguration', async (issuerBaseUrl: string) => {
    return getRemoteOpenIdConfiguration(issuerBaseUrl);
  });

  fastify.decorate(
    'refreshAuthTokens',
    async (currentRefreshToken: string, oidcConfig: { clientId: string; scopes: string }, tokenEndpoint: string) => {
      const { clientId, scopes } = oidcConfig;

      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: currentRefreshToken,
        client_id: clientId,
        scope: scopes,
      });

      let response: Response;
      try {
        response = await fetch(tokenEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: body.toString(),
        });
      } catch (cause) {
        throw new AuthUpstreamError('OAuth token refresh endpoint is unavailable.', {
          code: 'oauth_refresh_unavailable',
          statusCode: 503,
          context: { operation: 'refresh' },
          cause,
        });
      }

      const responseBodyText = await readOAuthResponseBody(response, 'refresh');
      if (!response.ok) {
        throw createOAuthEndpointError('refresh', response.status, responseBodyText);
      }

      const newTokens = parseOAuthTokenResponse(responseBodyText, 'refresh', response.status);

      return {
        accessToken: newTokens.access_token,
        refreshToken: typeof newTokens.refresh_token === 'string' ? newTokens.refresh_token : undefined,
        expiresIn: typeof newTokens.expires_in === 'number' ? newTokens.expires_in : undefined,
      };
    },
  );

  // @ts-ignore
  fastify.decorate('prepareOidcLoginRedirect', async (request, oidcConfig, authorizationEndpoint, stateKey) => {
    if (stateKey === undefined) {
      stateKey = 'oauthState';
    }
    request.log.info('Preparing OIDC login redirect.');

    const { redirectTo } = request.query;
    if (!isAllowedRedirectTo(redirectTo)) {
      throw new ExpectedAuthError('Invalid post-login redirect target.', {
        code: 'invalid_redirect_target',
        statusCode: 400,
        publicMessage: 'Invalid redirect target.',
      });
    }
    await request.encryptedSession.set('postLoginRedirectRoute', redirectTo);

    const { clientId, redirectUri, scopes } = oidcConfig;

    const state = crypto.randomBytes(16).toString('hex');
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

    await request.encryptedSession.set(stateKey, state);
    await request.encryptedSession.set('codeVerifier', codeVerifier);
    request.log.info(
      {
        stateSet: Boolean(state),
        verifierSet: Boolean(codeVerifier),
      },
      'OAuth state and code verifier set in encryptedSession.',
    );

    const url = new URL(authorizationEndpoint);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('scope', scopes);
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');

    request.log.info('Prepared OIDC login redirect.');

    return url.toString();
  });

  // @ts-ignore
  fastify.decorate('handleOidcCallback', async (request, oidcConfig, tokenEndpoint, stateKey) => {
    if (stateKey === undefined) {
      stateKey = 'oauthState';
    }
    request.log.info('Handling OIDC callback to retrieve the tokens.');

    const { clientId, redirectUri } = oidcConfig;

    const { code, state, error: callbackError } = request.query;
    const expectedState = request.encryptedSession.get(stateKey);
    if (typeof state !== 'string' || typeof expectedState !== 'string' || state !== expectedState) {
      throw new ExpectedAuthError('OIDC callback state did not match the session.', {
        code: 'invalid_oauth_state',
        statusCode: 400,
        publicMessage: 'Invalid OAuth state.',
        logLevel: 'warn',
      });
    }
    if (typeof callbackError === 'string') {
      throw createOAuthAuthorizationError(callbackError);
    }
    if (typeof code !== 'string' || code.length === 0) {
      throw new ExpectedAuthError('Authorization code is missing from OIDC callback.', {
        code: 'missing_callback_code',
        statusCode: 400,
        publicMessage: 'Missing authorization code.',
      });
    }

    const codeVerifier = request.encryptedSession.get('codeVerifier');
    if (typeof codeVerifier !== 'string' || codeVerifier.length === 0) {
      throw new ExpectedAuthError('PKCE code verifier is missing from the session.', {
        code: 'missing_code_verifier',
        statusCode: 400,
        publicMessage: 'Invalid OAuth session.',
        logLevel: 'warn',
      });
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier,
    });

    let response: Response;
    try {
      response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          accept: 'application/json',
        },
        body,
      });
    } catch (cause) {
      throw new AuthUpstreamError('OAuth token exchange endpoint is unavailable.', {
        code: 'oauth_token_exchange_unavailable',
        statusCode: 503,
        context: { operation: 'token_exchange' },
        cause,
      });
    }

    const responseBodyText = await readOAuthResponseBody(response, 'token_exchange');
    if (!response.ok) {
      throw createOAuthEndpointError('token_exchange', response.status, responseBodyText);
    }

    const tokens = parseOAuthTokenResponse(responseBodyText, 'token_exchange', response.status);

    const result = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: null,
      userInfo: extractUserInfoFromIdToken(request, tokens.id_token),
      postLoginRedirectRoute: request.encryptedSession.get('postLoginRedirectRoute') || '',
    };

    if (tokens.expires_in && typeof tokens.expires_in === 'number') {
      const expiresAt = Date.now() + tokens.expires_in * 1000;
      // @ts-ignore
      result.expiresAt = expiresAt;
    }

    request.telemetry.breadcrumb('OIDC callback succeeded; tokens retrieved.', {
      level: 'info',
      context: { hasUserInfo: result.userInfo !== null },
    });
    return result;
  });
}

// @ts-ignore
function extractUserInfoFromIdToken(request, idToken) {
  request.log.info('Extracting user info from ID token.');

  if (!idToken) {
    return null;
  }

  const payloadBase64 = idToken.split('.')[1];
  if (typeof payloadBase64 !== 'string' || payloadBase64.length === 0) {
    throw new AuthUpstreamError('ID token is not a well-formed JWT.', {
      code: 'malformed_id_token',
      context: { operation: 'token_exchange' },
    });
  }

  let decodedPayload;
  try {
    decodedPayload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
  } catch (cause) {
    throw new AuthUpstreamError('ID token payload could not be decoded.', {
      code: 'malformed_id_token',
      context: { operation: 'token_exchange' },
      cause,
    });
  }

  if (typeof decodedPayload.sub !== 'string' || decodedPayload.sub.length === 0) {
    request.log.warn('ID token missing sub claim.');
    return null;
  }

  request.log.info('User info extracted from ID token.');
  return {
    sub: decodedPayload.sub,
    email: decodedPayload.email,
  };
}

export default fp(authUtilsPlugin);
