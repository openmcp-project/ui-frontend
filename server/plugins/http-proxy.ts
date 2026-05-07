import fp from 'fastify-plugin';
import httpProxy from '@fastify/http-proxy';

const BLOCKED_PATH_PATTERN = /:\/\/|%2e%2e/i;

// @ts-ignore
function proxyPlugin(fastify) {
  const { API_BACKEND_URL, GRAPHQL_BACKEND_URL, HEADLAMP_UPSTREAM_URL } = fastify.config;

  // @ts-ignore
  fastify.addHook('onRequest', async (req, reply) => {
    const pathname = req.url.split('?')[0];
    if (BLOCKED_PATH_PATTERN.test(pathname)) {
      reply.code(400).send();
      return;
    }
  });

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
      child.addHook('onSend', async (_req: any, reply: any, payload: any) => {
        reply.removeHeader('x-frame-options');
        reply.removeHeader('cross-origin-opener-policy');
        reply.removeHeader('cross-origin-resource-policy');
        reply.removeHeader('cross-origin-embedder-policy');
        return payload;
      });

      child.post('/headlamp-kubeconfig', async (req: any, reply: any) => {
        const { kubeconfig } = req.body as { kubeconfig?: string };
        if (!kubeconfig || typeof kubeconfig !== 'string') {
          return reply.badRequest('Missing kubeconfig');
        }
        const mcpToken = req.encryptedSession.get('mcp_accessToken');
        let finalKubeconfig = kubeconfig;
        if (mcpToken) {
          try {
            const raw = Buffer.from(kubeconfig, 'base64').toString('utf8');
            const patched = raw.replace(/((?:^|\n)\s*token:\s*)bff-managed(\s|$)/m, (_m, pre, post) => `${pre}${mcpToken}${post}`);
            finalKubeconfig = Buffer.from(patched).toString('base64');
          } catch {
            // keep original if patching fails
          }
        }
        await req.encryptedSession.set('headlamp_kubeconfig', finalKubeconfig);
        // Register with headlamp server-to-server so the patched kubeconfig (containing the real token) never leaves the BFF.
        const parseRes = await fetch(`${HEADLAMP_UPSTREAM_URL}/api/headlamp/parseKubeConfig`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kubeconfigs: [finalKubeconfig] }),
        });
        if (!parseRes.ok) {
          return reply.internalServerError(`Headlamp parseKubeConfig failed: ${parseRes.status}`);
        }
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
          // @ts-ignore
          rewriteHeaders: (headers: Record<string, string>) => {
            const out = { ...headers };
            delete out['x-frame-options'];
            delete out['content-security-policy'];
            delete out['cross-origin-opener-policy'];
            delete out['cross-origin-resource-policy'];
            delete out['cross-origin-embedder-policy'];
            // Prevent browsers from caching Headlamp plugin JS files so updates
            // (e.g. kiosk-plugin ConfigMap changes) take effect on next reload.
            if (out['content-type']?.includes('javascript')) {
              out['cache-control'] = 'no-store';
              delete out['last-modified'];
              delete out['etag'];
            }
            return out;
          },
        },
      });
    });
  }
}

export default fp(proxyPlugin);
