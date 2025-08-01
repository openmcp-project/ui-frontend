import fp from 'fastify-plugin';
import { AuthenticationError } from '../plugins/auth-utils.js';

const stateSessionKey = 'oauthStateMCP';

// @ts-ignore
async function authPlugin(fastify) {
  const { OIDC_ISSUER, OIDC_CLIENT_ID_MCP, OIDC_REDIRECT_URI, OIDC_SCOPES, POST_LOGIN_REDIRECT } = fastify.config;

  // Make MCP issuer configuration globally available
  // TODO: This is a temporary solution until we have a proper way to manage multiple issuers
  const mcpIssuerConfiguration = await fastify.discoverIssuerConfiguration(OIDC_ISSUER);
  fastify.decorate('mcpIssuerConfiguration', mcpIssuerConfiguration);

  // @ts-ignore
  fastify.get('/auth/mcp/login', async function (req, reply) {
    const redirectUri = await fastify.prepareOidcLoginRedirect(
      req,
      {
        clientId: OIDC_CLIENT_ID_MCP,
        redirectUri: OIDC_REDIRECT_URI,
        scopes: OIDC_SCOPES,
      },
      mcpIssuerConfiguration.authorizationEndpoint,
      stateSessionKey,
    );

    return reply.redirect(redirectUri);
  });

  // @ts-ignore
  fastify.get('/auth/mcp/callback', async function (req, reply) {
    try {
      const callbackResult = await fastify.handleOidcCallback(
        req,
        {
          clientId: OIDC_CLIENT_ID_MCP,
          redirectUri: OIDC_REDIRECT_URI,
        },
        mcpIssuerConfiguration.tokenEndpoint,
        stateSessionKey,
      );

      await req.encryptedSession.set('mcp_accessToken', callbackResult.accessToken);
      await req.encryptedSession.set('mcp_refreshToken', callbackResult.refreshToken);

      if (callbackResult.expiresAt) {
        await req.encryptedSession.set('mcp_tokenExpiresAt', callbackResult.expiresAt);
      } else {
        await req.encryptedSession.delete('mcp_tokenExpiresAt');
      }

      return reply.redirect(POST_LOGIN_REDIRECT + callbackResult.postLoginRedirectRoute);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        req.log.error('AuthenticationError during OIDC callback: %s', error);
        return reply.serviceUnavailable('Error during OIDC callback.');
      } else {
        throw error;
      }
    }
  });

  // @ts-ignore
  fastify.get('/auth/mcp/me', async function (req, reply) {
    const accessToken = req.encryptedSession.get('mcp_accessToken');

    const isAuthenticated = Boolean(accessToken);
    return reply.send({ isAuthenticated });
  });
}

export default fp(authPlugin);
