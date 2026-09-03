import type { FastifyBaseLogger } from 'fastify';
import type { ServerTelemetry } from '../types.js';

export class PinoAdapter implements ServerTelemetry {
  constructor(private readonly logger: FastifyBaseLogger) {}

  report(error: unknown, options?: { message?: string; context?: Record<string, unknown> }): void {
    this.logger.error({ err: error, ...options?.context }, options?.message ?? 'Error reported');
  }

  breadcrumb(message: string, options?: { level?: 'info' | 'warning'; context?: Record<string, unknown> }): void {
    const context = options?.context ?? {};
    if (options?.level === 'warning') {
      this.logger.warn(context, message);
    } else {
      this.logger.info(context, message);
    }
  }
}
