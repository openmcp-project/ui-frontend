import fp from 'fastify-plugin';
import httpProxy from '@fastify/http-proxy';

const BLOCKED_PATH_PATTERN = /:\/\/|%2e%2e/i;

// Extract the cluster alias from a Headlamp proxy path.
// Paths look like /headlamp/clusters/<alias>/… or /headlamp/c/<alias>/…
const CLUSTER_ALIAS_PATTERN = /^\/headlamp\/(?:clusters|c)\/([^/]+)/;

function kubeconfigForRequest(req: any): string | undefined {
  const match = req.url.split('?')[0].match(CLUSTER_ALIAS_PATTERN);
  if (!match) return undefined;
  const alias = decodeURIComponent(match[1]);
  const map = req.encryptedSession.get('headlamp_kubeconfigs');
  return map?.[alias];
}

// Build upstream headers: strip browser cookies, accept-encoding, and
// client-auth headers that must not leak to Headlamp.
// @ts-ignore
function upstreamHeaders(headers) {
  const { cookie: _, 'accept-encoding': _ae, authorization: _az, kubeconfig: _kc, 'x-headlamp-user-id': _uid, ...rest } =
    headers;
  return rest;
}

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
      // Auth gate: reject unauthenticated requests before they reach Headlamp.
      child.addHook('onRequest', async (req: any, reply: any) => {
        if (!req.encryptedSession.get('onboarding_accessToken') || !req.encryptedSession.get('mcp_accessToken')) {
          return reply.code(401).send({ message: 'Unauthorized' });
        }
      });

      child.addHook('onSend', async (_req: any, reply: any, payload: any) => {
        reply.removeHeader('x-frame-options');
        reply.removeHeader('cross-origin-opener-policy');
        reply.removeHeader('cross-origin-resource-policy');
        reply.removeHeader('cross-origin-embedder-policy');
        return payload;
      });

      child.post('/headlamp-kubeconfig', async (req: any, reply: any) => {
        const { kubeconfig, clusterAlias } = req.body as { kubeconfig?: string; clusterAlias?: string };
        if (!kubeconfig || typeof kubeconfig !== 'string') {
          return reply.badRequest('Missing kubeconfig');
        }
        if (!clusterAlias || typeof clusterAlias !== 'string') {
          return reply.badRequest('Missing clusterAlias');
        }

        // Store the kubeconfig as-is (tokenless) in a per-alias map.
        // The BFF injects the current session token at request time.
        const map = req.encryptedSession.get('headlamp_kubeconfigs') ?? {};
        map[clusterAlias] = kubeconfig;
        await req.encryptedSession.set('headlamp_kubeconfigs', map);

        try {
          const parseRes = await fetch(`${HEADLAMP_UPSTREAM_URL}/api/headlamp/parseKubeConfig`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kubeconfigs: [kubeconfig] }),
          });
          if (!parseRes.ok) {
            return reply.internalServerError(`Headlamp parseKubeConfig failed: ${parseRes.status}`);
          }
        } catch (err) {
          return reply.internalServerError(`Headlamp parseKubeConfig request failed: ${err}`);
        }
        return reply.send({ ok: true });
      });

      child.register(httpProxy, {
        prefix: '/headlamp',
        upstream: HEADLAMP_UPSTREAM_URL,
        rewritePrefix: '/api/headlamp',
        websocket: true,
        wsServerOptions: { maxPayload: 16 * 1024 * 1024 },
        wsClientOptions: {
          rewriteRequestHeaders: (headers: any, req: any) => {
            const base = upstreamHeaders(headers);
            const token = req.encryptedSession.get('mcp_accessToken');
            const kubeconfig = kubeconfigForRequest(req);
            if (token) base.authorization = `Bearer ${token}`;
            if (kubeconfig) base.kubeconfig = kubeconfig;
            return base;
          },
        },
        replyOptions: {
          // @ts-ignore
          rewriteRequestHeaders: (req: any, headers: any) => {
            const base = upstreamHeaders(headers);
            const token = req.encryptedSession.get('mcp_accessToken');
            const kubeconfig = kubeconfigForRequest(req);
            if (token) base.authorization = `Bearer ${token}`;
            if (kubeconfig) base.kubeconfig = kubeconfig;
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
            delete out['set-cookie'];
            // Prevent browsers from caching Headlamp assets so that redeployments
            // (e.g. new build hash, kiosk-plugin ConfigMap changes) take effect on next reload.
            if (out['content-type']?.includes('javascript') || out['content-type']?.includes('text/html')) {
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
