import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

const SLOW_REQUEST_MS = 3000;

const classify = (route: string) =>
  route.startsWith('/api/health') ? 'probe'
  : route.startsWith('/api/headlamp') ? 'headlamp'
  : route.startsWith('/api/') ? 'api'
  : 'asset';

async function accessLogPlugin(fastify: FastifyInstance) {
  fastify.addHook('onResponse', async (req, reply) => {
    const path = req.url.split('?')[0];
    const route = req.routeOptions?.url ?? path;
    const cls = classify(route);
    const ms = Math.round(reply.elapsedTime);
    const status = reply.statusCode;
    const level: 'error' | 'warn' | 'info' | 'debug' =
      status >= 500 ? 'error'
      : status === 429 || ms > SLOW_REQUEST_MS ? 'warn'
      : cls === 'api' ? 'info'
      : 'debug';
    req.log[level](
      { event: 'http.request', class: cls, method: req.method, route, path, status, durationMs: ms },
      `${req.method} ${path} ${status} ${ms}ms`,
    );
  });
}

export default fp(accessLogPlugin);
