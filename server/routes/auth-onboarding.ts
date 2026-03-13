import fp from 'fastify-plugin';
import { AuthenticationError } from '../plugins/auth-utils.js';

const stateSessionKey = 'oauthStateOnboarding';

// @ts-ignore
async function authPlugin(fastify) {
  const { OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_REDIRECT_URI, OIDC_SCOPES, POST_LOGIN_REDIRECT } = fastify.config;

  // Make onboarding issuer configuration globally available
  const issuerConfiguration = await fastify.discoverIssuerConfiguration(OIDC_ISSUER);
  fastify.decorate('issuerConfiguration', issuerConfiguration);

  // @ts-ignore
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

  // @ts-ignore
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

  // @ts-expect-error - Fastify plugin route handler typing needs refinement
  fastify.get('/auth/onboarding/me', async function (req, reply) {
    const accessToken = req.encryptedSession.get('onboarding_accessToken');
    const userInfo = req.encryptedSession.get('onboarding_userInfo');
    const tokenExpiresAt = req.encryptedSession.get('onboarding_tokenExpiresAt');

    const isAuthenticated = Boolean(accessToken);
    const user = isAuthenticated ? userInfo : null;
    return reply.send({ isAuthenticated, user, tokenExpiresAt: tokenExpiresAt ?? null });
  });

  // @ts-expect-error - Fastify plugin route handler typing needs refinement
  fastify.post('/auth/onboarding/refresh', async function (req, reply) {
    const refreshToken = req.encryptedSession.get('onboarding_refreshToken');
    if (!refreshToken) {
      req.log.error('Missing refresh token; deleting encryptedSession.');
      await req.encryptedSession.clear();
      return reply.unauthorized('Session expired without token refresh capability.');
    }

    req.log.info('Attempting onboarding token refresh');

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
        req.log.error('Token refresh failed (no access token); deleting session.');
        await req.encryptedSession.clear();
        return reply.unauthorized('Session expired and token refresh failed.');
      }

      req.log.info('Token refresh successful; updating the session.');

      await req.encryptedSession.set('onboarding_accessToken', refreshedTokenData.accessToken);
      if (refreshedTokenData.refreshToken) {
        await req.encryptedSession.set('onboarding_refreshToken', refreshedTokenData.refreshToken);
      } else {
        await req.encryptedSession.delete('onboarding_refreshToken');
      }
      if (refreshedTokenData.expiresIn) {
        const newExpiresAt = Date.now() + refreshedTokenData.expiresIn * 1000;
        await req.encryptedSession.set('onboarding_tokenExpiresAt', newExpiresAt);
      } else {
        await req.encryptedSession.delete('onboarding_tokenExpiresAt');
      }

      req.log.info('Token refresh successful and session updated; continuing with the HTTP request.');
    } catch (error) {
      if (error instanceof AuthenticationError) {
        req.log.error('AuthenticationError during token refresh: %s', error);
        return reply.unauthorized('Error during token refresh.');
      } else {
        throw error;
      }
    }

    return reply.send({ success: true });
  });

  // @ts-ignore
  fastify.post('/auth/logout', async function (req, reply) {
    // TODO: Idp sign out flow
    await req.encryptedSession.clear();
    return reply.send({ message: 'Logged out' });
  });
}

export default fp(authPlugin);
