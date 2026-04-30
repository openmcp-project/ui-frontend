import fp from 'fastify-plugin';
import httpProxy from '@fastify/http-proxy';

// @ts-ignore
function proxyPlugin(fastify) {
  const { API_BACKEND_URL, GRAPHQL_BACKEND_URL, HEADLAMP_UPSTREAM_URL } = fastify.config;

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

  if (HEADLAMP_UPSTREAM_URL) {
    // Register a scoped child plugin so the onSend hook only applies to /headlamp routes
    fastify.register(async (child: any) => {
      // Strip headers that would block Headlamp from loading in an iframe
      child.addHook('onSend', async (_req: any, reply: any, payload: any) => {
        reply.removeHeader('x-frame-options');
        reply.removeHeader('content-security-policy');
        return payload;
      });

      child.register(httpProxy, {
        prefix: '/headlamp',
        upstream: HEADLAMP_UPSTREAM_URL,
        rewritePrefix: '/api/headlamp',
        websocket: true,
        replyOptions: {
          // @ts-ignore
          rewriteRequestHeaders: (req: any, headers: any) => {
            const token = req.encryptedSession.get('mcp_accessToken');
            if (!token) return stripEncoding(headers);
            return { ...stripEncoding(headers), authorization: `Bearer ${token}` };
          },
        },
      });
    });
  }
}

export default fp(proxyPlugin);
