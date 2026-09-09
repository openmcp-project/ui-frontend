import fp from 'fastify-plugin';
import type { FastifyBaseLogger, FastifyPluginAsync } from 'fastify';
import { ServerTelemetryService } from './ServerTelemetryService.js';
import { SentryServerAdapter } from './adapters/SentryServerAdapter.js';
import { PinoAdapter } from './adapters/PinoAdapter.js';
import type { ServerTelemetry } from './types.js';

declare module 'fastify' {
  interface FastifyInstance {
    telemetry: ServerTelemetry;
  }

  interface FastifyRequest {
    telemetry: ServerTelemetry;
  }
}

const createServerTelemetry = (
  logger: FastifyBaseLogger,
  contextIndependentAdapters: readonly ServerTelemetry[],
): ServerTelemetry => {
  return new ServerTelemetryService([...contextIndependentAdapters, new PinoAdapter(logger)]);
};

const serverTelemetryPlugin: FastifyPluginAsync = async (fastify) => {
  const contextIndependentAdapters: readonly ServerTelemetry[] = [
    // ── Telemetry providers ─────────────────────────────
    new SentryServerAdapter(),
  ];

  fastify.decorate('telemetry', createServerTelemetry(fastify.log, contextIndependentAdapters));
  fastify.decorateRequest('telemetry', null as unknown as ServerTelemetry);
  fastify.addHook('onRequest', async (request) => {
    request.telemetry = createServerTelemetry(request.log, contextIndependentAdapters);
  });
};

export default fp(serverTelemetryPlugin, {
  fastify: '5.x',
  name: 'server-telemetry',
});
