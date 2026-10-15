import type { Telemetry, TelemetryUser } from '../types';
import type { TelemetryFeature } from '../features';
import '../bootstrap/matomo';

export class MatomoAdapter implements Telemetry {
  track(feature: TelemetryFeature): void {
    if (!window._paq) return;

    const { category, action, ...rest } = feature;
    const keys = Object.keys(rest);
    const name = keys.length > 0 ? String((rest as Record<string, unknown>)[keys[0]]) : undefined;
    window._paq.push(name ? ['trackEvent', category, action, name] : ['trackEvent', category, action]);
  }

  report(_error: unknown, _options?: { message?: string; context?: Record<string, unknown> }): void {}

  identify(user: TelemetryUser | null): void {
    if (!window._paq) return;

    if (user) {
      window._paq.push(['setUserId', user.id]);
    } else {
      window._paq.push(['resetUserId']);
    }
  }

  breadcrumb(_message: string, _options?: { level?: 'info' | 'warning'; context?: Record<string, unknown> }) {}
}
