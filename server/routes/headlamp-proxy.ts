import fp from 'fastify-plugin';
import httpProxy from '@fastify/http-proxy';

/**
 * Proxies /api/headlamp/* → HEADLAMP_URL/*
 *
 * This allows the frontend (served from a different port) to call Headlamp's
 * dynamic cluster API (/cluster) without CORS issues.
 *
 * Example: POST /api/headlamp/cluster → POST http://localhost:8080/cluster
 */
// @ts-ignore
async function headlampProxy(fastify) {
  // @ts-ignore
  const headlampUrl: string = fastify.config.HEADLAMP_URL;
  if (!headlampUrl) return; // Headlamp not configured — skip

  fastify.register(httpProxy, {
    prefix: '/headlamp',
    upstream: headlampUrl,
    rewritePrefix: '',
  });
}

export default fp(headlampProxy);
