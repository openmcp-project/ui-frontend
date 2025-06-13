import fp from "fastify-plugin";
import { AuthenticationError } from "../plugins/auth-utils.js";


async function authPlugin(fastify) {
  const { OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_REDIRECT_URI, OIDC_SCOPES, POST_LOGIN_REDIRECT } = fastify.config;


  // Make onboarding issuer configuration globally available
  const issuerConfiguration = await fastify.discoverIssuerConfiguration(OIDC_ISSUER);
  fastify.decorate("issuerConfiguration", issuerConfiguration);


  fastify.get("/auth/onboarding/login", async (req, reply) => {
    const redirectUri = fastify.prepareOidcLoginRedirect(req, {
      clientId: OIDC_CLIENT_ID,
      redirectUri: OIDC_REDIRECT_URI,
      scopes: OIDC_SCOPES,
    }, issuerConfiguration.authorizationEndpoint);

    reply.redirect(redirectUri);
  });


  fastify.get("/auth/onboarding/callback", async (req, reply) => {
    try {
      const callbackResult = await fastify.handleOidcCallback(req, {
        clientId: OIDC_CLIENT_ID,
        redirectUri: OIDC_REDIRECT_URI,
      }, issuerConfiguration.tokenEndpoint);

      req.session.set("onboarding_accessToken", callbackResult.accessToken);
      req.session.set("onboarding_refreshToken", callbackResult.refreshToken);
      req.session.set("onboarding_userInfo", callbackResult.userInfo);

      if (callbackResult.expiresAt) {
        req.session.set("onboarding_tokenExpiresAt", callbackResult.expiresAt);
      } else {
        req.session.delete("onboarding_tokenExpiresAt");
      }

      reply.redirect(POST_LOGIN_REDIRECT + callbackResult.postLoginRedirectRoute);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        req.log.error("AuthenticationError during OIDC callback: %s", error);
        return reply.serviceUnavailable("Error during OIDC callback.");
      } else {
        throw error;
      }
    }
  });


  fastify.get("/auth/onboarding/me", async (req, reply) => {
    const accessToken = req.session.get("onboarding_accessToken");
    const userInfo = req.session.get("onboarding_userInfo");

    const isAuthenticated = Boolean(accessToken);
    const user = isAuthenticated ? userInfo : null;
    reply.send({ isAuthenticated, user });
  });

  fastify.post("/auth/logout", async (req, reply) => {
    // TODO: Idp sign out flow
    req.session.destroy();
    reply.send({ message: "Logged out" });
  });
}

export default fp(authPlugin);
