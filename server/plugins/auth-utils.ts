import fp from 'fastify-plugin';
import crypto from 'node:crypto';
import * as Sentry from '@sentry/node';

export class AuthenticationError extends Error {
  // @ts-ignore
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    // @ts-ignore
    this.code = 'ERR_AUTHENTICATION';
    Error.captureStackTrace(this, this.constructor);
  }
}

// @ts-ignore
async function getRemoteOpenIdConfiguration(issuerBaseUrl) {
  const url = new URL('/.well-known/openid-configuration', issuerBaseUrl).toString();
  const res = await fetch(url);
  if (!res.ok) {
    throw new AuthenticationError(`OIDC discovery failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// @ts-ignore
function isAllowedRedirectTo(value) {
  if (!value) return true;
  const first = value.charAt(0);
  return first === '/' || first === '#';
}

// @ts-ignore
async function authUtilsPlugin(fastify) {
  // @ts-ignore
  fastify.decorate('discoverIssuerConfiguration', async (issuerBaseUrl) => {
    fastify.log.info({ issuer: issuerBaseUrl }, 'Discovering OpenId configuration.');

    const remoteConfiguration = await getRemoteOpenIdConfiguration(issuerBaseUrl) as any; // ToDo: proper typing

    const requiredConfiguration = {
      authorizationEndpoint: remoteConfiguration.authorization_endpoint,
      tokenEndpoint: remoteConfiguration.token_endpoint,
    };

    fastify.log.info({ issuer: issuerBaseUrl, requiredConfiguration }, 'OpenId configuration discovered.');

    return requiredConfiguration;
  });

  // @ts-ignore
  fastify.decorate('refreshAuthTokens', async (currentRefreshToken, oidcConfig, tokenEndpoint) => {
    fastify.log.info('Refreshing tokens.');

    const { clientId, scopes } = oidcConfig;

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: currentRefreshToken,
      client_id: clientId,
      scope: scopes,
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
    });
    const responseBodyText = await response.text();
    if (!response.ok) {
      fastify.log.error({ status: response.status, idpResponseBody: responseBodyText }, 'Token refresh failed.');
      throw new AuthenticationError('Token refresh failed.');
    }

    const newTokens = JSON.parse(responseBodyText);
    fastify.log.info('Token refresh successful; received new tokens.');

    return {
      accessToken: newTokens.access_token,
      refreshToken: newTokens.refresh_token,
      expiresIn: newTokens.expires_in,
    };
  });

  // @ts-ignore
  fastify.decorate('prepareOidcLoginRedirect', async (request, oidcConfig, authorizationEndpoint, stateKey) => {
    if (stateKey === undefined) {
      stateKey = 'oauthState';
    }
    request.log.info('Preparing OIDC login redirect.');

    const { redirectTo } = request.query;
    if (!isAllowedRedirectTo(redirectTo)) {
      request.log.error(`Invalid redirectTo: "${redirectTo}".`);
      throw new AuthenticationError('Invalid redirectTo.');
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

    const { code, state } = request.query;
    if (!code) {
      request.log.error('Missing authorization code in callback.');
      throw new AuthenticationError('Missing code in callback.');
    }
    if (state !== request.encryptedSession.get(stateKey)) {
      request.log.error('Invalid state in callback.');
      throw new AuthenticationError('Invalid state in callback.');
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: request.encryptedSession.get('codeVerifier'),
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!response.ok) {
      request.log.error({ status: response.status, body: await response.text() }, 'Token exchange failed.');
      throw new AuthenticationError('Token exchange failed.');
    }

    const tokens = await response.json() as any; // ToDo: proper typing

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

    Sentry.addBreadcrumb({
      category: 'auth',
      // @ts-ignore
      message: 'Successfully authenticated user: ' + result.userInfo.email,
      level: 'info',
    });

    request.log.info('OIDC callback succeeded; tokens retrieved.');
    return result;
  });
}

// @ts-ignore
function extractUserInfoFromIdToken(request, idToken) {
  request.log.info('Extracting user info from ID token.');

  if (!idToken) {
    request.log.warn('No ID token provided.');
    return null;
  }

  const payloadBase64 = idToken.split('.')[1];
  const decodedPayload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));

  request.log.info('User info extracted from ID token.');
  return {
    email: decodedPayload.email,
  };
}

export default fp(authUtilsPlugin);
