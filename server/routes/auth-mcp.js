import fp from "fastify-plugin";
import { AuthenticationError } from "../plugins/auth-utils.js";


async function authPlugin(fastify) {
  const { OIDC_ISSUER, OIDC_CLIENT_ID_MCP, OIDC_REDIRECT_URI, OIDC_SCOPES, POST_LOGIN_REDIRECT } = fastify.config;

  // Make MCP issuer configuration globally available
  // TODO: This is a temporary solution until we have a proper way to manage multiple issuers
  const mcpIssuerConfiguration = await fastify.discoverIssuerConfiguration(OIDC_ISSUER);
  fastify.decorate("mcpIssuerConfiguration", mcpIssuerConfiguration);

  fastify.get("/auth/mcp/login", async (req, reply) => {
    const redirectUri = fastify.prepareOidcLoginRedirect(req, {
      clientId: OIDC_CLIENT_ID_MCP,
      redirectUri: OIDC_REDIRECT_URI,
      scopes: OIDC_SCOPES,
    }, mcpIssuerConfiguration.authorizationEndpoint);

    reply.redirect(redirectUri);
  });

  fastify.get("/auth/mcp/callback", async (req, reply) => {
    try {
      const callbackResult = await fastify.handleOidcCallback(req, {
        clientId: OIDC_CLIENT_ID_MCP,
        redirectUri: OIDC_REDIRECT_URI,
      }, mcpIssuerConfiguration.tokenEndpoint);

      req.encryptedSession.set("mcp_accessToken", callbackResult.accessToken);
      req.encryptedSession.set("mcp_refreshToken", callbackResult.refreshToken);

      if (callbackResult.expiresAt) {
        req.encryptedSession.set("mcp_tokenExpiresAt", callbackResult.expiresAt);
      } else {
        req.encryptedSession.delete("mcp_tokenExpiresAt");
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

  fastify.get("/auth/mcp/me", async (req, reply) => {
    const accessToken = req.encryptedSession.get("mcp_accessToken");

    const isAuthenticated = Boolean(accessToken);
    reply.send({ isAuthenticated });
  });
}

export default fp(authPlugin);
