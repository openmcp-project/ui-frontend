/** @vitest-environment node */

import Fastify from 'fastify';
import { Writable } from 'node:stream';
import pino from 'pino';
import { describe, expect, it } from 'vitest';

function buildApp() {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      lines.push(chunk.toString());
      callback();
    },
  });
  const logger = pino({ level: 'debug' }, stream);

  const REQUEST_ID_RE = /^[\w\-]{1,128}$/;
  const fastify = Fastify({
    loggerInstance: logger,
    genReqId(req) {
      const incoming = req.headers['x-request-id'];
      if (typeof incoming === 'string' && REQUEST_ID_RE.test(incoming)) {
        return incoming;
      }
      return crypto.randomUUID();
    },
  });

  fastify.addHook('onSend', async (req, reply) => {
    reply.header('x-request-id', req.id);
  });

  return { fastify, lines };
}

describe('x-request-id correlation', () => {
  it('returns a generated x-request-id when none is sent', async () => {
    const { fastify } = buildApp();
    fastify.get('/api/test', async () => ({ ok: true }));

    try {
      const response = await fastify.inject('/api/test');
      const reqId = response.headers['x-request-id'];
      expect(reqId).toBeDefined();
      expect(typeof reqId).toBe('string');
      expect((reqId as string).length).toBeGreaterThan(0);
    } finally {
      await fastify.close();
    }
  });

  it('accepts and returns a well-formed incoming x-request-id', async () => {
    const { fastify } = buildApp();
    fastify.get('/api/test', async () => ({ ok: true }));

    try {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/test',
        headers: { 'x-request-id': 'client-req-abc-123' },
      });
      expect(response.headers['x-request-id']).toBe('client-req-abc-123');
    } finally {
      await fastify.close();
    }
  });

  it('rejects malformed x-request-id and generates a new one', async () => {
    const { fastify } = buildApp();
    fastify.get('/api/test', async () => ({ ok: true }));

    try {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/test',
        headers: { 'x-request-id': 'bad id with spaces & specials!' },
      });
      const reqId = response.headers['x-request-id'] as string;
      expect(reqId).toBeDefined();
      expect(reqId).not.toBe('bad id with spaces & specials!');
    } finally {
      await fastify.close();
    }
  });

  it('includes the request id in log output', async () => {
    const { fastify, lines } = buildApp();
    fastify.get('/api/test', async (req) => {
      req.log.info('test log line');
      return { ok: true };
    });

    try {
      await fastify.inject({
        method: 'GET',
        url: '/api/test',
        headers: { 'x-request-id': 'trace-me-123' },
      });
      const entries = lines.map((l) => JSON.parse(l));
      const testLine = entries.find((e) => e.msg === 'test log line');
      expect(testLine).toBeDefined();
      expect(testLine.reqId).toBe('trace-me-123');
    } finally {
      await fastify.close();
    }
  });
});
