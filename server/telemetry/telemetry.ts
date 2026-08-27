import type { FastifyBaseLogger } from 'fastify';
import { ServerTelemetryService } from './ServerTelemetryService.js';
import { SentryServerAdapter } from './adapters/SentryServerAdapter.js';
import { PinoAdapter } from './adapters/PinoAdapter.js';
import type { ServerTelemetry } from './types.js';

const buildAdapters = (logger: FastifyBaseLogger): ServerTelemetry[] => {
  return [
    // ── Telemetry providers ─────────────────────────────
    new SentryServerAdapter(),
    new PinoAdapter(logger),
  ];
};

export const createServerTelemetry = (logger: FastifyBaseLogger): ServerTelemetry => {
  return new ServerTelemetryService(buildAdapters(logger));
};
