import fp from 'fastify-plugin';
import httpProxy from '@fastify/http-proxy';

const BLOCKED_PATH_PATTERN = /:\/\/|%2e%2e/i;

// @ts-ignore
function proxyPlugin(fastify) {
  const { API_BACKEND_URL } = fastify.config;
  const { GRAPHQL_BACKEND_URL } = fastify.config;

  // @ts-ignore
  fastify.addHook('onRequest', async (req, reply) => {
    const pathname = req.url.split('?')[0];
    if (BLOCKED_PATH_PATTERN.test(pathname)) {
      reply.code(400).send();
      return;
    }
  });

  const requireAuthentication = async (req, reply) => {
    const accessToken = req.encryptedSession.get('onboarding_accessToken');
    if (!accessToken) {
      reply.code(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Authentication required' });
      return;
    }
  };

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
    preHandler: requireAuthentication,
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
      preHandler: requireAuthentication,
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
