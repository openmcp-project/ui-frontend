import type { Telemetry, TelemetryUser } from '../types';
import type { TelemetryFeature } from '../features';
import { UNKNOWN_PAGE, type VirtualPage } from '../pageView/virtualPage';

export class ConsoleAdapter implements Telemetry {
  track(feature: TelemetryFeature): void {
    const { category, action, ...rest } = feature;
    console.info('[Telemetry] track', `${category}.${action}`, rest);
  }

  pageView(page: VirtualPage): void {
    if (page === UNKNOWN_PAGE) {
      console.warn('[Telemetry] pageView: route not declared in Routes.ts, reported as', page);
      return;
    }
    console.info('[Telemetry] pageView', page);
  }

  report(error: unknown, options?: { message?: string; context?: Record<string, unknown> }): void {
    console.error('[Telemetry] report', options?.message ?? 'Error', error, options?.context ?? {});
  }

  breadcrumb(message: string, options?: { level?: 'info' | 'warning'; context?: Record<string, unknown> }): void {
    console.debug('[Telemetry] breadcrumb', message, options?.level ?? 'info', options?.context ?? {});
  }

  identify(user: TelemetryUser | null): void {
    if (user) {
      console.info('[Telemetry] identify ', user);
    }
  }
}
