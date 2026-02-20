import fp from 'fastify-plugin';
import httpProxy from '@fastify/http-proxy';
import { AuthenticationError } from './auth-utils.js';
import * as Sentry from '@sentry/node';

// @ts-ignore
function proxyPlugin(fastify) {
  const { API_BACKEND_URL } = fastify.config;
  const { GRAPHQL_BACKEND_URL } = fastify.config;
  const { OIDC_CLIENT_ID, OIDC_SCOPES } = fastify.config;

  // @ts-ignore
  const preHandler = async (request, reply) => {
    request.log.info('Entering HTTP proxy preHandler.');

    const useCrate = request.headers['x-use-crate'];
    Sentry.setTag('useCrate', useCrate);

    const keyAccessToken = useCrate ? 'onboarding_accessToken' : 'mcp_accessToken';
    const keyTokenExpiresAt = useCrate ? 'onboarding_tokenExpiresAt' : 'mcp_tokenExpiresAt';
    const keyRefreshToken = useCrate ? 'onboarding_refreshToken' : 'mcp_refreshToken';

    // Check if there is an access token
    const accessToken = request.encryptedSession.get(keyAccessToken);
    if (!accessToken) {
      request.log.error('Missing access token.');
      return reply.unauthorized('Missing access token.');
    }

    // Check if the access token is expired or about to expire
    const expiresAt = request.encryptedSession.get(keyTokenExpiresAt);
    const now = Date.now();
    const REFRESH_BUFFER_MILLISECONDS = 20 * 1000; // to allow for network latency
    if (!expiresAt || now < expiresAt - REFRESH_BUFFER_MILLISECONDS) {
      request.log.info('Access token is still valid; no refresh needed.');
      return;
    }

    Sentry.addBreadcrumb({
      category: 'auth',
      message: 'Attempt token refresh',
      level: 'info',
      data: {
        expiresAt,
      },
    });

    request.log.info(
      { expiresAt: new Date(expiresAt).toISOString() },
      'Access token is expired or about to expire; attempting refresh.',
    );

    // Check if there is a refresh token
    const refreshToken = request.encryptedSession.get(keyRefreshToken);
    if (!refreshToken) {
      request.log.error('Missing refresh token; deleting encryptedSession.');
      await request.encryptedSession.clear(); //TODO: also clear user encrpytion key?
      return reply.unauthorized('Session expired without token refresh capability.');
    }

     // Attempt to refresh the tokens
    try {
      const issuerConfiguration = fastify.issuerConfiguration;

      const refreshedTokenData = await fastify.refreshAuthTokens(
        refreshToken,
        {
          clientId: OIDC_CLIENT_ID,
          scopes: OIDC_SCOPES,
        },
        issuerConfiguration.tokenEndpoint,
      );
      if (!refreshedTokenData || !refreshedTokenData.accessToken) {
        request.log.error('Token refresh failed (no access token); deleting session.');
        await request.encryptedSession.clear();
        return reply.unauthorized('Session expired and token refresh failed.');
      }

      request.log.info('Token refresh successful; updating the session.');

      await request.encryptedSession.set(keyAccessToken, refreshedTokenData.accessToken);
      if (refreshedTokenData.refreshToken) {
        await request.encryptedSession.set(keyRefreshToken, refreshedTokenData.refreshToken);
      } else {
        await request.encryptedSession.delete(keyRefreshToken);
      }
      if (refreshedTokenData.expiresIn) {
        const newExpiresAt = Date.now() + refreshedTokenData.expiresIn * 1000;
        await request.encryptedSession.set(keyTokenExpiresAt, newExpiresAt);
      } else {
        await request.encryptedSession.delete(keyTokenExpiresAt);
      }

      request.log.info('Token refresh successful and session updated; continuing with the HTTP request.');
    } catch (error) {
      if (error instanceof AuthenticationError) {
        request.log.error('AuthenticationError during token refresh: %s', error);
        return reply.unauthorized('Error during token refresh.');
      } else {
        throw error;
      }
    }
  };

  const replyOptions = {
    // @ts-ignore
    rewriteRequestHeaders: (req, headers) => {
      const useCrate = req.headers['x-use-crate'];
      const accessToken = useCrate
        ? req.encryptedSession.get('onboarding_accessToken')
        : `${req.encryptedSession.get('onboarding_accessToken')},${req.encryptedSession.get('mcp_accessToken')}`;


      // Remove accept-encoding to prevent backend from compressing
      // This avoids double-compression or encoding issues
      const { 'accept-encoding': _, ...restHeaders } = headers;

      return {
        ...restHeaders,
        authorization: accessToken,
      };
    },
  };

  fastify.register(httpProxy, {
    prefix: '/onboarding',
    upstream: API_BACKEND_URL,
    // @ts-ignore
    preHandler,
    replyOptions,
  });

  if (GRAPHQL_BACKEND_URL) {
    fastify.register(httpProxy, {
      prefix: '/graphql',
      upstream: GRAPHQL_BACKEND_URL,
      preHandler,
      replyOptions,
    });
  }
}

export default fp(proxyPlugin);
