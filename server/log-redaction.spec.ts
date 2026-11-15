/** @vitest-environment node */

import Fastify from 'fastify';
import { Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';

function buildCapturingLogger() {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      lines.push(chunk.toString());
      callback();
    },
  });
  return { lines, stream };
}

describe('req serializer query-string redaction', () => {
  it('strips code and state from OIDC callback URLs', async () => {
    const { lines, stream } = buildCapturingLogger();

    const fastify = Fastify({
      logger: {
        stream,
        serializers: {
          req: (req) => ({
            method: req.method,
            url: req.url.split('?')[0],
            host: req.hostname,
            remoteAddress: req.ip,
          }),
        },
      },
    });

    fastify.get('/api/auth/onboarding/callback', async () => ({ ok: true }));
    fastify.get('/api/auth/mcp/callback', async () => ({ ok: true }));

    try {
      await fastify.inject({
        method: 'GET',
        url: '/api/auth/onboarding/callback?code=secret_auth_code_123&state=secret_state_456',
      });

      await fastify.inject({
        method: 'GET',
        url: '/api/auth/mcp/callback?code=another_secret_code&state=another_secret_state',
      });

      const output = lines.join('\n');

      expect(output).not.toContain('secret_auth_code_123');
      expect(output).not.toContain('secret_state_456');
      expect(output).not.toContain('another_secret_code');
      expect(output).not.toContain('another_secret_state');

      expect(output).toContain('/api/auth/onboarding/callback');
      expect(output).toContain('/api/auth/mcp/callback');
    } finally {
      await fastify.close();
    }
  });

  it('preserves the path for regular API routes', async () => {
    const { lines, stream } = buildCapturingLogger();

    const fastify = Fastify({
      logger: {
        stream,
        serializers: {
          req: (req) => ({
            method: req.method,
            url: req.url.split('?')[0],
            host: req.hostname,
            remoteAddress: req.ip,
          }),
        },
      },
    });

    fastify.get('/api/health', async () => ({ status: 'ok' }));

    try {
      await fastify.inject({ method: 'GET', url: '/api/health?check=deep' });

      const output = lines.join('\n');

      expect(output).toContain('/api/health');
      expect(output).not.toContain('check=deep');
    } finally {
      await fastify.close();
    }
  });
});
