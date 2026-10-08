import type { Telemetry, TelemetryUser } from './types';
import type { TelemetryFeature } from './features';
import type { VirtualPage } from './pageView/virtualPage';

export class TelemetryService implements Telemetry {
  constructor(private readonly adapters: Telemetry[]) {}

  track(feature: TelemetryFeature): void {
    this.dispatch('track', (a) => a.track(feature));
  }

  pageView(page: VirtualPage): void {
    this.dispatch('pageView', (a) => a.pageView(page));
  }

  report(error: unknown, options?: { message?: string; context?: Record<string, unknown> }): void {
    this.dispatch('report', (a) => a.report(error, options));
  }

  breadcrumb(message: string, options?: { level?: 'info' | 'warning'; context?: Record<string, unknown> }): void {
    this.dispatch('breadcrumb', (a) => a.breadcrumb(message, options));
  }

  identify(user: TelemetryUser | null): void {
    this.dispatch('identify', (a) => a.identify(user));
  }

  private dispatch(method: keyof Telemetry, call: (adapter: Telemetry) => void): void {
    for (const adapter of this.adapters) {
      try {
        call(adapter);
      } catch (err) {
        console.error(`[TelemetryService] ${adapter.constructor.name}.${method} failed:`, err);
      }
    }
  }
}
