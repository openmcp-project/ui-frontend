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
  method: string;
  headers: Record<string, string | string[] | undefined>;
}

let upstreamServer: Server;
let wss: WebSocketServer;
let upstreamPort: number;
const upstreamRequests: UpstreamReq[] = [];
const upstreamWsRequests: UpstreamReq[] = [];

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
    GRAPHQL_BACKEND_URL: `http://127.0.0.1:${upstreamPort}/graphql-gw`,
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
    upstreamRequests.push({ url: req.url!, method: req.method!, headers: { ...req.headers } });

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
    upstreamWsRequests.push({ url: req.url!, method: req.method!, headers: { ...req.headers } });
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

// ---------------------------------------------------------------------------
// S1: Auth gate on every proxy route
// ---------------------------------------------------------------------------

describe('S1 — Auth gate', () => {
  it('/onboarding: 401 without session', async () => {
    const app = await buildApp();
    try {
      const res = await app.inject({ method: 'GET', url: '/onboarding/some-resource' });
      expect(res.statusCode).toBe(401);
      expect(upstreamRequests).toHaveLength(0);
    } finally {
      await app.close();
    }
  });

  it('/onboarding with x-use-crate: 200 with only onboarding token', async () => {
    const app = await buildApp({
      withSession: { onboarding_accessToken: 'ob-tok' },
    });
    try {
      const res = await app.inject({
        method: 'GET',
        url: '/onboarding/resource',
        headers: { 'x-use-crate': '1' },
      });
      expect(res.statusCode).toBe(200);
    } finally {
      await app.close();
    }
  });

  it('/onboarding without x-use-crate: 401 when mcp token missing', async () => {
    const app = await buildApp({
      withSession: { onboarding_accessToken: 'ob-tok' },
    });
    try {
      const res = await app.inject({ method: 'GET', url: '/onboarding/resource' });
      expect(res.statusCode).toBe(401);
    } finally {
      await app.close();
    }
  });

  it('/graphql: 401 without session', async () => {
    const app = await buildApp();
    try {
      const res = await app.inject({ method: 'POST', url: '/graphql' });
      expect(res.statusCode).toBe(401);
      expect(upstreamRequests).toHaveLength(0);
    } finally {
      await app.close();
    }
  });

  it('/graphql: 200 with onboarding token', async () => {
    const app = await buildApp({
      withSession: { onboarding_accessToken: 'ob-tok' },
    });
    try {
      const res = await app.inject({ method: 'POST', url: '/graphql' });
      expect(res.statusCode).toBe(200);
    } finally {
      await app.close();
    }
  });

  it('/headlamp: 401 without session', async () => {
    const app = await buildApp();
    try {
      const res = await app.inject({ method: 'GET', url: '/headlamp/config' });
      expect(res.statusCode).toBe(401);
      expect(upstreamRequests).toHaveLength(0);
    } finally {
      await app.close();
    }
  });

  it('/headlamp-kubeconfig: 401 without session', async () => {
    const app = await buildApp();
    try {
      const res = await app.inject({
        method: 'POST',
        url: '/headlamp-kubeconfig',
        payload: { kubeconfig: 'abc', clusterAlias: 'x' },
      });
      expect(res.statusCode).toBe(401);
    } finally {
      await app.close();
    }
  });

  it('websocket upgrade: 401 without session (HTTP path)', async () => {
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

// ---------------------------------------------------------------------------
// S1: Client-supplied credentials never forwarded
// ---------------------------------------------------------------------------

describe('S1 — Credential stripping', () => {
  it('/onboarding: client authorization/cookie/x-headlamp-user-id not forwarded', async () => {
    const app = await buildApp({
      withSession: { onboarding_accessToken: 'ob', mcp_accessToken: 'mcp' },
    });
    try {
      await app.inject({
        method: 'GET',
        url: '/onboarding/resource',
        headers: {
          authorization: 'Bearer evil',
          cookie: 'session=stolen',
          'x-headlamp-user-id': 'attacker@evil.com',
        },
      });
      const upstream = upstreamRequests[0];
      expect(upstream).toBeDefined();
      expect(upstream.headers.authorization).toBe('ob,mcp');
      expect(upstream.headers.cookie).toBeUndefined();
      expect(upstream.headers['x-headlamp-user-id']).toBeUndefined();
    } finally {
      await app.close();
    }
  });

  it('/headlamp: client credentials replaced with session values', async () => {
    const app = await buildApp({
      withSession: {
        onboarding_accessToken: 'ob',
        mcp_accessToken: 'mcp-real',
        headlamp_kubeconfigs: { alias: 'kc-data' },
      },
    });
    try {
      await app.inject({
        method: 'GET',
        url: '/headlamp/clusters/alias/api/v1/pods',
        headers: {
          authorization: 'Bearer evil',
          kubeconfig: 'evil-kc',
          cookie: 'session=stolen',
          'x-headlamp-user-id': 'attacker@evil.com',
          'x-headlamp-backend-token': 'evil-token',
        },
      });
      const upstream = upstreamRequests[0];
      expect(upstream).toBeDefined();
      expect(upstream.headers.authorization).toBe('Bearer mcp-real');
      expect(upstream.headers.kubeconfig).toBe('kc-data');
      expect(upstream.headers.cookie).toBeUndefined();
      expect(upstream.headers['x-headlamp-user-id']).toBeUndefined();
      expect(upstream.headers['x-headlamp-backend-token']).toBeUndefined();
    } finally {
      await app.close();
    }
  });
});

// ---------------------------------------------------------------------------
// S1: Blocked Headlamp management routes
// ---------------------------------------------------------------------------

describe('S1 — Blocked Headlamp management routes', () => {
  const session = { onboarding_accessToken: 'ob', mcp_accessToken: 'mcp' };

  const blockedRoutes = [
    { method: 'POST' as const, url: '/headlamp/cluster' },
    { method: 'DELETE' as const, url: '/headlamp/cluster/my-alias' },
    { method: 'POST' as const, url: '/headlamp/parseKubeConfig' },
    { method: 'GET' as const, url: '/headlamp/externalproxy/anything' },
    { method: 'POST' as const, url: '/headlamp/drain-node/node-1' },
    { method: 'POST' as const, url: '/headlamp/plugins' },
  ];

  for (const { method, url } of blockedRoutes) {
    it(`${method} ${url}: 403`, async () => {
      const app = await buildApp({ withSession: session });
      try {
        const res = await app.inject({ method, url });
        expect(res.statusCode).toBe(403);
        expect(res.json()).toEqual({ message: 'Forbidden' });
      } finally {
        await app.close();
      }
    });
  }

  it('GET /headlamp/config is allowed', async () => {
    const app = await buildApp({ withSession: session });
    try {
      const res = await app.inject({ method: 'GET', url: '/headlamp/config' });
      expect(res.statusCode).toBe(200);
    } finally {
      await app.close();
    }
  });
});

// ---------------------------------------------------------------------------
// S4: Cookie stripping
// ---------------------------------------------------------------------------

describe('S4 — Cookie stripping', () => {
  it('strips set-cookie from Headlamp upstream responses', async () => {
    const cookieServer = createServer((_req, res) => {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Set-Cookie': 'headlamp-auth=abc; Path=/',
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

// ---------------------------------------------------------------------------
// H1: WebSocket credential injection
// ---------------------------------------------------------------------------

describe('H1 — WebSocket upgrade', () => {
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
});

// ---------------------------------------------------------------------------
// Kubeconfig registration
// ---------------------------------------------------------------------------

describe('Kubeconfig registration', () => {
  it('stores kubeconfig per alias and registers without x-headlamp-user-id', async () => {
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
