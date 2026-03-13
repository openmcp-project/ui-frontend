import fp from 'fastify-plugin';
import httpProxy from '@fastify/http-proxy';

// @ts-ignore
function proxyPlugin(fastify) {
  const { API_BACKEND_URL } = fastify.config;
  const { GRAPHQL_BACKEND_URL } = fastify.config;

  // @ts-ignore
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
    replyOptions,
  });

  if (GRAPHQL_BACKEND_URL) {
    fastify.register(httpProxy, {
      prefix: '/graphql',
      upstream: GRAPHQL_BACKEND_URL,
      replyOptions,
    });
  }
}

export default fp(proxyPlugin);
