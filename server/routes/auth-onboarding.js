import fp from 'fastify-plugin';
import { AuthenticationError } from '../plugins/auth-utils.js';

const stateSessionKey = 'oauthStateOnboarding';

async function authPlugin(fastify) {
  const { OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_REDIRECT_URI, OIDC_SCOPES, POST_LOGIN_REDIRECT } = fastify.config;

  // Make onboarding issuer configuration globally available
  const issuerConfiguration = await fastify.discoverIssuerConfiguration(OIDC_ISSUER);
  fastify.decorate('issuerConfiguration', issuerConfiguration);

  fastify.get('/auth/onboarding/login', async function (req, reply) {
    const redirectUri = await fastify.prepareOidcLoginRedirect(
      req,
      {
        clientId: OIDC_CLIENT_ID,
        redirectUri: OIDC_REDIRECT_URI,
        scopes: OIDC_SCOPES,
      },
      issuerConfiguration.authorizationEndpoint,
      stateSessionKey,
    );

    return reply.redirect(redirectUri);
  });

  fastify.get('/auth/onboarding/callback', async function (req, reply) {
    try {
      const callbackResult = await fastify.handleOidcCallback(
        req,
        {
          clientId: OIDC_CLIENT_ID,
          redirectUri: OIDC_REDIRECT_URI,
        },
        issuerConfiguration.tokenEndpoint,
        stateSessionKey,
      );

      await req.encryptedSession.set('onboarding_accessToken', callbackResult.accessToken);
      await req.encryptedSession.set('onboarding_refreshToken', callbackResult.refreshToken);
      await req.encryptedSession.set('onboarding_userInfo', callbackResult.userInfo);

      if (callbackResult.expiresAt) {
        await req.encryptedSession.set('onboarding_tokenExpiresAt', callbackResult.expiresAt);
      } else {
        await req.encryptedSession.delete('onboarding_tokenExpiresAt');
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

  fastify.get('/auth/onboarding/me', async function (req, reply) {
    const accessToken = req.encryptedSession.get('onboarding_accessToken');
    const userInfo = req.encryptedSession.get('onboarding_userInfo');

    const isAuthenticated = Boolean(accessToken);
    const user = isAuthenticated ? userInfo : null;
    return reply.send({ isAuthenticated, user });
  });

  fastify.post('/auth/logout', async function (req, reply) {
    // TODO: Idp sign out flow
    await req.encryptedSession.clear();
    return reply.send({ message: 'Logged out' });
  });
}

export default fp(authPlugin);
