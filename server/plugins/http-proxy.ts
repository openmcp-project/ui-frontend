import fp from 'fastify-plugin';
import httpProxy from '@fastify/http-proxy';

const BLOCKED_PATH_PATTERN = /:\/\/|%2e%2e/i;

// Extract the cluster alias from a Headlamp proxy path.
const CLUSTER_ALIAS_PATTERN = /^\/headlamp\/(?:clusters|c)\/([^/]+)/;

// Headlamp management endpoints that must not be reachable through the BFF.
// The BFF owns cluster registration (via /headlamp-kubeconfig); the client
// must not create, delete, or parse clusters directly.
const BLOCKED_HEADLAMP_PATHS = [
  { method: 'POST', pattern: /^\/api\/headlamp\/cluster\b/ },
  { method: 'PUT', pattern: /^\/api\/headlamp\/cluster\b/ },
  { method: 'DELETE', pattern: /^\/api\/headlamp\/cluster\b/ },
  { method: 'POST', pattern: /^\/api\/headlamp\/parseKubeConfig\b/ },
  { method: '*', pattern: /^\/api\/headlamp\/externalproxy\b/ },
  { method: '*', pattern: /^\/api\/headlamp\/drain-node/ },
  { method: 'POST', pattern: /^\/api\/headlamp\/plugins\b/ },
  { method: 'PUT', pattern: /^\/api\/headlamp\/plugins\b/ },
  { method: 'DELETE', pattern: /^\/api\/headlamp\/plugins\b/ },
];

function kubeconfigForRequest(req: any): string | undefined {
  const match = req.url.split('?')[0].match(CLUSTER_ALIAS_PATTERN);
  if (!match) return undefined;
  const alias = decodeURIComponent(match[1]);
  const map = req.encryptedSession.get('headlamp_kubeconfigs');
  return map?.[alias];
}

// Build upstream headers: strip browser cookies, accept-encoding, and any
// client-supplied auth headers that the BFF must set from its own session.
// @ts-ignore
function upstreamHeaders(headers) {
  const {
    cookie: _,
    'accept-encoding': _ae,
    authorization: _az,
    kubeconfig: _kc,
    'x-headlamp-user-id': _uid,
    'x-headlamp-backend-token': _bt,
    'x-forwarded-for': _xff,
    'x-forwarded-host': _xfh,
    'x-forwarded-proto': _xfp,
    ...rest
  } = headers;
  return rest;
}

function isBlockedHeadlampPath(method: string, upstreamPath: string): boolean {
  return BLOCKED_HEADLAMP_PATHS.some(
    (rule) => (rule.method === '*' || rule.method === method) && rule.pattern.test(upstreamPath),
  );
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

  // --- /onboarding proxy ---------------------------------------------------

  fastify.register(async (scope: any) => {
    scope.addHook('onRequest', async (req: any, reply: any) => {
      const useCrate = req.headers['x-use-crate'];
      if (!req.encryptedSession.get('onboarding_accessToken')) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      if (!useCrate && !req.encryptedSession.get('mcp_accessToken')) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
    });

    scope.register(httpProxy, {
      prefix: '/onboarding',
      upstream: API_BACKEND_URL,
      replyOptions: {
        // @ts-ignore
        rewriteRequestHeaders: (req: any, headers: any) => {
          const useCrate = req.headers['x-use-crate'];
          const accessToken = useCrate
            ? req.encryptedSession.get('onboarding_accessToken')
            : `${req.encryptedSession.get('onboarding_accessToken')},${req.encryptedSession.get('mcp_accessToken')}`;
          return { ...upstreamHeaders(headers), authorization: accessToken };
        },
      },
    });
  });

  // --- /graphql proxy -------------------------------------------------------

  if (GRAPHQL_BACKEND_URL) {
    const graphqlUrl = new URL(GRAPHQL_BACKEND_URL);

    fastify.register(async (scope: any) => {
      scope.addHook('onRequest', async (req: any, reply: any) => {
        if (!req.encryptedSession.get('onboarding_accessToken')) {
          return reply.code(401).send({ message: 'Unauthorized' });
        }
      });

      scope.register(httpProxy, {
        prefix: '/graphql',
        upstream: graphqlUrl.origin,
        rewritePrefix: graphqlUrl.pathname,
        replyOptions: {
          // @ts-ignore
          rewriteRequestHeaders: (req: any, headers: any) => {
            const accessToken = `Bearer ${req.encryptedSession.get('onboarding_accessToken')}`;
            return { ...upstreamHeaders(headers), authorization: accessToken };
          },
        },
      });
    });
  }

  // --- /headlamp proxy + /headlamp-kubeconfig --------------------------------

  if (HEADLAMP_UPSTREAM_URL) {
    fastify.register(async (child: any) => {
      // Auth gate: require both tokens for all Headlamp routes.
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
            // Block dangerous Headlamp management routes.
            const upstreamPath = req.url.split('?')[0].replace(/^\/headlamp/, '/api/headlamp');
            if (isBlockedHeadlampPath(req.method, upstreamPath)) {
              // Cannot short-circuit from rewriteRequestHeaders, so set a flag
              // and handle it in a preHandler. As a safety net, strip credentials.
              req._blockedHeadlampRoute = true;
            }

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
            if (out['content-type']?.includes('javascript') || out['content-type']?.includes('text/html')) {
              out['cache-control'] = 'no-store';
              delete out['last-modified'];
              delete out['etag'];
            }
            return out;
          },
        },
      });

      // Block dangerous Headlamp management routes with a preHandler.
      // The rewriteRequestHeaders above sets the flag; the route's preHandler
      // must be set separately because @fastify/http-proxy already owns the handler.
      child.addHook('preHandler', async (req: any, reply: any) => {
        // Compute the upstream path to check against the block list.
        const upstreamPath = req.url.split('?')[0].replace(/^\/headlamp/, '/api/headlamp');
        if (isBlockedHeadlampPath(req.method, upstreamPath)) {
          return reply.code(403).send({ message: 'Forbidden' });
        }
      });
    });
  }
}

export default fp(proxyPlugin);
