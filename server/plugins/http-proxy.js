import fp from "fastify-plugin";
import httpProxy from "@fastify/http-proxy";
import { AuthenticationError } from "./auth-utils.js";

function proxyPlugin(fastify) {
  const { API_BACKEND_URL } = fastify.config;
  const { OIDC_CLIENT_ID, OIDC_SCOPES } = fastify.config;

  fastify.register(httpProxy, {
    prefix: "/onboarding",
    upstream: API_BACKEND_URL,
    preHandler: async (request, reply) => {
      request.log.info("Entering HTTP proxy preHandler.");

      // Check if there is an access token
      const accessToken = request.session.get("accessToken");
      if (!accessToken) {
        request.log.error("Missing access token.");
        return reply.unauthorized("Missing access token.");
      }

      // Check if the access token is expired or about to expire
      const expiresAt = request.session.get("tokenExpiresAt");
      const now = Date.now();
      const REFRESH_BUFFER_SECONDS = 20; // to allow for network latency
      if (!expiresAt || now < expiresAt - REFRESH_BUFFER_SECONDS) {
        request.log.info("Access token is still valid; no refresh needed.");
        return;
      }

      request.log.info({ expiresAt: new Date(expiresAt).toISOString() }, "Access token is expired or about to expire; attempting refresh.");

      // Check if there is a refresh token
      const refreshToken = request.session.get("refreshToken");
      if (!refreshToken) {
        request.log.error("Missing refresh token; deleting session.");
        request.session.destroy();
        return reply.unauthorized("Session expired without token refresh capability.");
      }

      // Attempt to refresh the tokens
      try {
        const issuerConfiguration = fastify.issuerConfiguration;

        const refreshedTokenData = await fastify.refreshAuthTokens(refreshToken, {
          clientId: OIDC_CLIENT_ID,
          scopes: OIDC_SCOPES,
        }, issuerConfiguration.tokenEndpoint);
        if (!refreshedTokenData || !refreshedTokenData.accessToken) {
          request.log.error("Token refresh failed (no access token); deleting session.");
          request.session.destroy();
          return reply.unauthorized("Session expired and token refresh failed.");
        }

        request.log.info("Token refresh successful; updating the session.");

        request.session.set("accessToken", refreshedTokenData.accessToken);
        if (refreshedTokenData.refreshToken) {
          request.session.set("refreshToken", refreshedTokenData.refreshToken);
        } else {
          request.session.delete("refreshToken");
        }
        if (refreshedTokenData.expiresIn) {
          const newExpiresAt = Date.now() + (refreshedTokenData.expiresIn * 1000);
          request.session.set("tokenExpiresAt", newExpiresAt);
        } else {
          request.session.delete("tokenExpiresAt");
        }

        request.log.info("Token refresh successful and session updated; continuing with the HTTP request.");
      } catch (error) {
        if (error instanceof AuthenticationError) {
          request.log.error("AuthenticationError during token refresh: %s", error);
          return reply.unauthorized("Error during token refresh.");
        } else {
          throw error;
        }
      }
    },
    replyOptions: {
      rewriteRequestHeaders: (req, headers) => ({
        ...headers,
        authorization: req.session.get("accessToken")
      }),
    },
  });
}

export default fp(proxyPlugin);
