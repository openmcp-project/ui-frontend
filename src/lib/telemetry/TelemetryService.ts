import type { Telemetry, TelemetryUser } from './types';
import type { TelemetryFeature } from './features';

export class TelemetryService implements Telemetry {
  constructor(private readonly adapters: Telemetry[]) {}

  track(feature: TelemetryFeature): void {
    this.dispatch('track', (a) => a.track(feature));
  }

  report(error: unknown, options?: { message?: string; context?: Record<string, unknown> }): void {
    this.dispatch('report', (a) => a.report(error, options));
  }

  identify(user: TelemetryUser | null): void {
    this.dispatch('identify', (a) => a.identify(user));
  }

  private dispatch(method: 'track' | 'report' | 'identify', call: (adapter: Telemetry) => void): void {
    for (const adapter of this.adapters) {
      try {
        call(adapter);
      } catch (err) {
        console.error(`[TelemetryService] ${adapter.constructor.name}.${method} failed:`, err);
      }
    }
  }
}
