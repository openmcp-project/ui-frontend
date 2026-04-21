import fp from 'fastify-plugin';
import httpProxy from '@fastify/http-proxy';

// @ts-ignore
function proxyPlugin(fastify) {
  const { API_BACKEND_URL } = fastify.config;
  const { GRAPHQL_BACKEND_URL } = fastify.config;

  // Remove accept-encoding to prevent backend from compressing
  // This avoids double-compression or encoding issues
  // @ts-ignore
  const stripEncoding = (headers) => {
    const { 'accept-encoding': _, ...rest } = headers;
    return rest;
  };

  fastify.register(httpProxy, {
    prefix: '/onboarding',
    upstream: API_BACKEND_URL,
    replyOptions: {
      // @ts-ignore
      rewriteRequestHeaders: (req, headers) => {
        const useCrate = req.headers['x-use-crate'];
        const accessToken = useCrate
          ? req.encryptedSession.get('onboarding_accessToken')
          : `${req.encryptedSession.get('onboarding_accessToken')},${req.encryptedSession.get('mcp_accessToken')}`;

        return { ...stripEncoding(headers), authorization: accessToken };
      },
    },
  });

  if (GRAPHQL_BACKEND_URL) {
    const graphqlUrl = new URL(GRAPHQL_BACKEND_URL);

    fastify.register(httpProxy, {
      prefix: '/graphql',
      upstream: graphqlUrl.origin,
      rewritePrefix: graphqlUrl.pathname,
      replyOptions: {
        // @ts-ignore
        rewriteRequestHeaders: (req, headers) => {
          const accessToken = `Bearer ${req.encryptedSession.get('onboarding_accessToken')}`;
          return { ...stripEncoding(headers), authorization: accessToken };
        },
      },
    });
  }
}

export default fp(proxyPlugin);
