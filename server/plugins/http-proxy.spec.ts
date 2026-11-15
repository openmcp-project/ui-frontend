/** @vitest-environment node */

import { createServer, type Server, type IncomingMessage } from 'node:http';
import { once } from 'node:events';
import { WebSocketServer, WebSocket } from 'ws';
import Fastify from 'fastify';
import fp from 'fastify-plugin';
import sensible from '@fastify/sensible';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

interface UpstreamReq {
  url: string;
  headers: Record<string, string | string[] | undefined>;
}

let upstreamServer: Server;
let wss: WebSocketServer;
let upstreamPort: number;
const upstreamRequests: UpstreamReq[] = [];
const upstreamWsRequests: UpstreamReq[] = [];

// Minimal encrypted-session stub — wrapped with fp() so the decorator is
// visible in every encapsulation scope, matching the real plugin's behaviour.
const fakeEncryptedSession = fp(async (fastify) => {
  fastify.decorateRequest('encryptedSession', {
    getter() {
      // @ts-ignore
      if (!this._fakeStore) this._fakeStore = {};
      return {
        // @ts-ignore
        get: (key: string) => this._fakeStore[key],
        // @ts-ignore
        set: async (key: string, value: unknown) => {
          // @ts-ignore
          this._fakeStore[key] = value;
        },
        // @ts-ignore
        delete: async (key: string) => {
          // @ts-ignore
          delete this._fakeStore[key];
        },
      };
    },
  });
});

async function buildApp(opts: { withSession?: Record<string, unknown> } = {}) {
  const app = Fastify({ logger: false });

  app.decorate('config', {
    API_BACKEND_URL: `http://127.0.0.1:${upstreamPort}`,
    GRAPHQL_BACKEND_URL: undefined,
    HEADLAMP_UPSTREAM_URL: `http://127.0.0.1:${upstreamPort}`,
  });

  await app.register(fakeEncryptedSession);
  await app.register(sensible);

  if (opts.withSession) {
    app.addHook('onRequest', async (req) => {
      for (const [k, v] of Object.entries(opts.withSession!)) {
        await req.encryptedSession.set(k, v);
      }
    });
  }

  const proxyPlugin = await import('./http-proxy.js');
  await app.register(proxyPlugin.default);

  return app;
}

beforeAll(async () => {
  upstreamServer = createServer((req, res) => {
    upstreamRequests.push({ url: req.url!, headers: { ...req.headers } });

    if (req.url?.includes('parseKubeConfig')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ proxied: true }));
  });

  wss = new WebSocketServer({ server: upstreamServer });
  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    upstreamWsRequests.push({ url: req.url!, headers: { ...req.headers } });
    ws.send('hello from upstream');
  });

  upstreamServer.listen(0);
  await once(upstreamServer, 'listening');
  const addr = upstreamServer.address();
  upstreamPort = typeof addr === 'object' && addr ? addr.port : 0;
});

afterEach(() => {
  upstreamRequests.length = 0;
  upstreamWsRequests.length = 0;
});

afterAll(async () => {
  wss.close();
  upstreamServer.close();
});

describe('Headlamp proxy — HTTP', () => {
  it('rejects requests without a session (401)', async () => {
    const app = await buildApp();
    try {
      const res = await app.inject({ method: 'GET', url: '/headlamp/config' });
      expect(res.statusCode).toBe(401);
      expect(res.json()).toEqual({ message: 'Unauthorized' });
    } finally {
      await app.close();
    }
  });

  it('forwards authorization and kubeconfig, no x-headlamp-user-id or cookie upstream', async () => {
    const app = await buildApp({
      withSession: {
        onboarding_accessToken: 'ob-token',
        mcp_accessToken: 'mcp-tok-123',
        headlamp_kubeconfigs: { 'proj--ws--cp': 'a3ViZWNvbmZpZw==' },
      },
    });
    try {
      const res = await app.inject({
        method: 'GET',
        url: '/headlamp/clusters/proj--ws--cp/api/v1/pods?watch=1',
        headers: { cookie: 'session=should-not-leak' },
      });
      expect(res.statusCode).toBe(200);

      const upstream = upstreamRequests.find((r) => r.url?.includes('/api/v1/pods'));
      expect(upstream).toBeDefined();
      expect(upstream!.headers.authorization).toBe('Bearer mcp-tok-123');
      expect(upstream!.headers.kubeconfig).toBe('a3ViZWNvbmZpZw==');
      expect(upstream!.headers['x-headlamp-user-id']).toBeUndefined();
      expect(upstream!.headers.cookie).toBeUndefined();
    } finally {
      await app.close();
    }
  });

  it('strips set-cookie from upstream response headers', async () => {
    const cookieServer = createServer((_req, res) => {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Set-Cookie': 'headlamp-session=abc; Path=/',
      });
      res.end(JSON.stringify({ ok: true }));
    });
    cookieServer.listen(0);
    await once(cookieServer, 'listening');
    const cookieAddr = cookieServer.address();
    const cookiePort = typeof cookieAddr === 'object' && cookieAddr ? cookieAddr.port : 0;

    const app = Fastify({ logger: false });
    app.decorate('config', {
      API_BACKEND_URL: `http://127.0.0.1:${cookiePort}`,
      GRAPHQL_BACKEND_URL: undefined,
      HEADLAMP_UPSTREAM_URL: `http://127.0.0.1:${cookiePort}`,
    });
    await app.register(fakeEncryptedSession);
    await app.register(sensible);
    app.addHook('onRequest', async (req) => {
      await req.encryptedSession.set('onboarding_accessToken', 'ob');
      await req.encryptedSession.set('mcp_accessToken', 'mcp');
    });
    const proxyPlugin = await import('./http-proxy.js');
    await app.register(proxyPlugin.default);

    try {
      const res = await app.inject({ method: 'GET', url: '/headlamp/config' });
      expect(res.headers['set-cookie']).toBeUndefined();
    } finally {
      await app.close();
      cookieServer.close();
    }
  });
});

describe('Headlamp proxy — kubeconfig registration', () => {
  it('stores kubeconfig per alias and registers with Headlamp', async () => {
    const app = await buildApp({
      withSession: {
        onboarding_accessToken: 'ob-token',
        mcp_accessToken: 'mcp-tok-123',
      },
    });
    try {
      const res = await app.inject({
        method: 'POST',
        url: '/headlamp-kubeconfig',
        payload: { kubeconfig: 'a3ViZWNvbmZpZw==', clusterAlias: 'proj--ws--cp' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ ok: true });

      const parseReq = upstreamRequests.find((r) => r.url?.includes('parseKubeConfig'));
      expect(parseReq).toBeDefined();
      expect(parseReq!.headers['x-headlamp-user-id']).toBeUndefined();
    } finally {
      await app.close();
    }
  });

  it('rejects missing clusterAlias', async () => {
    const app = await buildApp({
      withSession: {
        onboarding_accessToken: 'ob-token',
        mcp_accessToken: 'mcp-tok-123',
      },
    });
    try {
      const res = await app.inject({
        method: 'POST',
        url: '/headlamp-kubeconfig',
        payload: { kubeconfig: 'a3ViZWNvbmZpZw==' },
      });
      expect(res.statusCode).toBe(400);
    } finally {
      await app.close();
    }
  });
});

describe('Headlamp proxy — WebSocket upgrade', () => {
  it('injects authorization and kubeconfig on upgrade', async () => {
    const app = await buildApp({
      withSession: {
        onboarding_accessToken: 'ob-token',
        mcp_accessToken: 'ws-tok-456',
        headlamp_kubeconfigs: { 'proj--ws--cp': 'dXBncmFkZS1rYw==' },
      },
    });
    const address = await app.listen({ port: 0, host: '127.0.0.1' });

    try {
      const ws = new WebSocket(
        `${address.replace('http', 'ws')}/headlamp/clusters/proj--ws--cp/api/v1/pods?watch=1`,
      );
      const msg = await new Promise<string>((resolve, reject) => {
        ws.on('message', (data) => resolve(data.toString()));
        ws.on('error', reject);
        setTimeout(() => reject(new Error('ws timeout')), 5000);
      });

      expect(msg).toBe('hello from upstream');

      const upstreamWs = upstreamWsRequests.find((r) => r.url?.includes('/api/v1/pods'));
      expect(upstreamWs).toBeDefined();
      expect(upstreamWs!.headers.authorization).toBe('Bearer ws-tok-456');
      expect(upstreamWs!.headers.kubeconfig).toBe('dXBncmFkZS1rYw==');
      expect(upstreamWs!.headers.cookie).toBeUndefined();

      ws.close();
    } finally {
      await app.close();
    }
  });

  it('rejects upgrade without a session (401 on HTTP path)', async () => {
    const app = await buildApp();
    try {
      const res = await app.inject({
        method: 'GET',
        url: '/headlamp/clusters/alias/api/v1/pods?watch=1',
      });
      expect(res.statusCode).toBe(401);
    } finally {
      await app.close();
    }
  });
});
