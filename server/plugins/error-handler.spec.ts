/** @vitest-environment node */

import Fastify from 'fastify';
import fp from 'fastify-plugin';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerTelemetry } from '../telemetry/types.js';
import { AuthUpstreamError, ExpectedAuthError, UpstreamUnavailableError } from '../auth/errors.js';
import errorHandlerPlugin from './error-handler.js';

describe('error-handler', () => {
  const report = vi.fn();
  const breadcrumb = vi.fn();

  beforeEach(() => {
    report.mockReset();
    breadcrumb.mockReset();
  });

  const buildFastify = async () => {
    const fakeTelemetry: ServerTelemetry = { report, breadcrumb };

    const fakeServerTelemetryPlugin = fp(
      async (fastify) => {
        fastify.decorate('telemetry', fakeTelemetry);
        fastify.decorateRequest('telemetry', null as unknown as ServerTelemetry);
        fastify.addHook('onRequest', async (request) => {
          request.telemetry = fakeTelemetry;
        });
      },
      { name: 'server-telemetry' },
    );

    const fastify = Fastify({ logger: false });
    await fastify.register(fakeServerTelemetryPlugin);
    await fastify.register(errorHandlerPlugin);

    fastify.get('/auth-upstream', async () => {
      throw new AuthUpstreamError('OAuth refresh failed with an unexpected identity-provider response.', {
        code: 'oauth_upstream_rejected',
      });
    });

    fastify.get('/upstream-unavailable', async () => {
      throw new UpstreamUnavailableError('OAuth token refresh endpoint is unavailable.', {
        code: 'oauth_refresh_unavailable',
        statusCode: 503,
      });
    });

    fastify.get('/expected-auth', async () => {
      throw new ExpectedAuthError('OIDC callback state did not match the session.', {
        code: 'invalid_oauth_state',
        statusCode: 401,
        publicMessage: 'Invalid OAuth state.',
      });
    });

    fastify.get('/unexpected', async () => {
      throw new Error('Boom.');
    });

    return fastify;
  };

  it('reports AuthUpstreamError and does not record a breadcrumb', async () => {
    const fastify = await buildFastify();
    try {
      const response = await fastify.inject('/auth-upstream');

      expect(response.statusCode).toBe(502);
      expect(report).toHaveBeenCalledTimes(1);
      expect(breadcrumb).not.toHaveBeenCalled();
    } finally {
      await fastify.close();
    }
  });

  it('records UpstreamUnavailableError as a warning breadcrumb and does not report it', async () => {
    const fastify = await buildFastify();
    try {
      const response = await fastify.inject('/upstream-unavailable');

      expect(response.statusCode).toBe(503);
      expect(breadcrumb).toHaveBeenCalledTimes(1);
      expect(breadcrumb).toHaveBeenCalledWith(
        'OAuth token refresh endpoint is unavailable.',
        expect.objectContaining({ level: 'warning' }),
      );
      expect(report).not.toHaveBeenCalled();
    } finally {
      await fastify.close();
    }
  });

  it('neither reports nor records a breadcrumb for an info-level ExpectedAuthError', async () => {
    const fastify = await buildFastify();
    try {
      const response = await fastify.inject('/expected-auth');

      expect(response.statusCode).toBe(401);
      expect(report).not.toHaveBeenCalled();
      expect(breadcrumb).not.toHaveBeenCalled();
    } finally {
      await fastify.close();
    }
  });

  it('returns a generic 500 for errors that are not an ApplicationError', async () => {
    const fastify = await buildFastify();
    try {
      const response = await fastify.inject('/unexpected');

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({ error: 'Internal Server Error' });
    } finally {
      await fastify.close();
    }
  });
});
