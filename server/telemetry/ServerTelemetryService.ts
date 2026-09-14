import type { ServerTelemetry } from './types.js';

export class ServerTelemetryService implements ServerTelemetry {
  constructor(private readonly adapters: readonly ServerTelemetry[]) {}

  report(error: unknown, options?: { message?: string; context?: Record<string, unknown> }): void {
    this.dispatch('report', (a) => a.report(error, options));
  }

  breadcrumb(message: string, options?: { level?: 'info' | 'warning'; context?: Record<string, unknown> }): void {
    this.dispatch('breadcrumb', (a) => a.breadcrumb(message, options));
  }

  private dispatch(method: 'report' | 'breadcrumb', call: (adapter: ServerTelemetry) => void): void {
    for (const adapter of this.adapters) {
      try {
        call(adapter);
      } catch (err) {
        console.error(`[ServerTelemetryService] ${adapter.constructor.name}.${method} failed:`, err);
      }
    }
  }
}
