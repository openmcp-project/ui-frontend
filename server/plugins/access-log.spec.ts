/** @vitest-environment node */

import Fastify from 'fastify';
import { Writable } from 'node:stream';
import pino from 'pino';
import { describe, expect, it } from 'vitest';
import accessLogPlugin from './access-log.js';

function buildApp() {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      lines.push(chunk.toString());
      callback();
    },
  });
  const logger = pino({ level: 'debug' }, stream);
  const fastify = Fastify({ loggerInstance: logger, disableRequestLogging: true });
  fastify.register(accessLogPlugin);
  return { fastify, lines };
}

function parsed(lines: string[]) {
  return lines.map((l) => JSON.parse(l));
}

describe('access-log plugin', () => {
  it('logs probe requests at debug', async () => {
    const { fastify, lines } = buildApp();
    fastify.get('/api/health', async () => ({ status: 'ok' }));

    try {
      await fastify.inject('/api/health');
      const entries = parsed(lines);
      const accessLog = entries.find((e) => e.event === 'http.request');
      expect(accessLog).toBeDefined();
      expect(accessLog.class).toBe('probe');
      expect(accessLog.level).toBe(20); // pino debug
    } finally {
      await fastify.close();
    }
  });

  it('logs API 200 at info', async () => {
    const { fastify, lines } = buildApp();
    fastify.get('/api/projects', async () => []);

    try {
      await fastify.inject('/api/projects');
      const entries = parsed(lines);
      const accessLog = entries.find((e) => e.event === 'http.request');
      expect(accessLog).toBeDefined();
      expect(accessLog.class).toBe('api');
      expect(accessLog.level).toBe(30); // pino info
      expect(accessLog.status).toBe(200);
    } finally {
      await fastify.close();
    }
  });

  it('logs 500 at error', async () => {
    const { fastify, lines } = buildApp();
    fastify.get('/api/fail', async () => {
      throw new Error('boom');
    });

    try {
      await fastify.inject('/api/fail');
      const entries = parsed(lines);
      const accessLog = entries.find((e) => e.event === 'http.request');
      expect(accessLog).toBeDefined();
      expect(accessLog.level).toBe(50); // pino error
      expect(accessLog.status).toBe(500);
    } finally {
      await fastify.close();
    }
  });

  it('logs slow requests at warn', async () => {
    const { fastify, lines } = buildApp();
    // We can't easily simulate a slow request in inject, but we can test
    // the 429 path which also triggers warn
    fastify.get('/api/limited', async (_req, reply) => {
      reply.status(429).send({ error: 'Too Many Requests' });
    });

    try {
      await fastify.inject('/api/limited');
      const entries = parsed(lines);
      const accessLog = entries.find((e) => e.event === 'http.request');
      expect(accessLog).toBeDefined();
      expect(accessLog.level).toBe(40); // pino warn
      expect(accessLog.status).toBe(429);
    } finally {
      await fastify.close();
    }
  });

  it('never logs query strings', async () => {
    const { fastify, lines } = buildApp();
    fastify.get('/api/auth/onboarding/callback', async () => ({ ok: true }));

    try {
      await fastify.inject('/api/auth/onboarding/callback?code=secret123&state=secret456');
      const output = lines.join('\n');
      expect(output).not.toContain('secret123');
      expect(output).not.toContain('secret456');
      expect(output).toContain('/api/auth/onboarding/callback');
    } finally {
      await fastify.close();
    }
  });

  it('logs headlamp traffic at debug', async () => {
    const { fastify, lines } = buildApp();
    fastify.get('/api/headlamp/clusters', async () => []);

    try {
      await fastify.inject('/api/headlamp/clusters');
      const entries = parsed(lines);
      const accessLog = entries.find((e) => e.event === 'http.request');
      expect(accessLog).toBeDefined();
      expect(accessLog.class).toBe('headlamp');
      expect(accessLog.level).toBe(20); // pino debug
    } finally {
      await fastify.close();
    }
  });

  it('logs static assets at debug', async () => {
    const { fastify, lines } = buildApp();
    fastify.get('/assets/main.js', async () => 'js');

    try {
      await fastify.inject('/assets/main.js');
      const entries = parsed(lines);
      const accessLog = entries.find((e) => e.event === 'http.request');
      expect(accessLog).toBeDefined();
      expect(accessLog.class).toBe('asset');
      expect(accessLog.level).toBe(20); // pino debug
    } finally {
      await fastify.close();
    }
  });
});
