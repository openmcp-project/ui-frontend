/** @vitest-environment node */

import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import type { ServerTelemetry } from './types.js';
import serverTelemetryPlugin from './telemetry.js';

describe('serverTelemetryPlugin', () => {
  it('provides one app-scoped facade and a distinct facade for every request', async () => {
    const fastify = Fastify({ logger: false });
    const requestTelemetry: ServerTelemetry[] = [];

    try {
      await fastify.register(serverTelemetryPlugin);
      const appTelemetry = fastify.telemetry;
      fastify.get('/telemetry-probe', async (request) => {
        requestTelemetry.push(request.telemetry);
        return { requestUsesAppTelemetry: request.telemetry === fastify.telemetry };
      });

      const firstResponse = await fastify.inject('/telemetry-probe');
      const secondResponse = await fastify.inject('/telemetry-probe');

      expect(firstResponse.json()).toEqual({ requestUsesAppTelemetry: false });
      expect(secondResponse.statusCode).toBe(200);
      expect(fastify.telemetry).toBe(appTelemetry);
      expect(requestTelemetry).toHaveLength(2);
      expect(requestTelemetry[0]).not.toBe(requestTelemetry[1]);
    } finally {
      await fastify.close();
    }
  });
});
