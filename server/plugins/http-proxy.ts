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
    fastify.register(async (child: any) => {
      // After helmet sets its headers on the reply, strip the ones that break
      // iframe embedding and sever the parent↔iframe postMessage channel (COOP/CORP).
      // This must run after the onRequest helmet hook, so we use onSend which fires last.
      child.addHook('onSend', async (req: any, reply: any, payload: any) => {
        reply.removeHeader('x-frame-options');
        reply.removeHeader('cross-origin-opener-policy');
        reply.removeHeader('cross-origin-resource-policy');
        reply.removeHeader('cross-origin-embedder-policy');
        return payload;
      });

      // Store a kubeconfig (base64) in the session so the proxy can forward it
      // as the KUBECONFIG header to Headlamp, enabling per-request stateless clusters.
      child.post('/headlamp-kubeconfig', async (req: any, reply: any) => {
        const { kubeconfig } = req.body as { kubeconfig?: string };
        if (!kubeconfig || typeof kubeconfig !== 'string') {
          return reply.badRequest('Missing kubeconfig');
        }
        await req.encryptedSession.set('headlamp_kubeconfig', kubeconfig);
        return reply.send({ ok: true });
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
            const kubeconfig = req.encryptedSession.get('headlamp_kubeconfig');
            const base = { ...stripEncoding(headers) };
            if (token) base.authorization = `Bearer ${token}`;
            if (kubeconfig) base['kubeconfig'] = kubeconfig;
            return base;
          },
          // Strip upstream headers that would conflict with the BFF's own CSP or block embedding
          // @ts-ignore
          rewriteHeaders: (headers: Record<string, string>) => {
            const out = { ...headers };
            delete out['x-frame-options'];
            delete out['content-security-policy'];
            delete out['cross-origin-opener-policy'];
            delete out['cross-origin-resource-policy'];
            delete out['cross-origin-embedder-policy'];
            return out;
          },
        },
      });
    });
  }
}

export default fp(proxyPlugin);
