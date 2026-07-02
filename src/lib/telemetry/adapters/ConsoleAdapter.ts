import type { Telemetry, TelemetryUser } from '../types';
import type { TelemetryFeature } from '../features';

export class ConsoleAdapter implements Telemetry {
  track(feature: TelemetryFeature): void {
    const { name, ...rest } = feature;
    console.info('[Telemetry] track', name, rest);
  }

  report(error: unknown, options?: { message?: string; context?: Record<string, unknown> }): void {
    console.error('[Telemetry] report', options?.message ?? 'Error', error, options?.context ?? {});
  }

  identify(user: TelemetryUser | null): void {
    console.info('[Telemetry] identify ', user);
  }
}
