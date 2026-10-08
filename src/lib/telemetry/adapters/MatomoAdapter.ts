import type { Telemetry, TelemetryUser } from '../types';
import type { TelemetryFeature } from '../features';
import type { VirtualPage } from '../pageView/virtualPage';
import '../bootstrap/matomo';

export class MatomoAdapter implements Telemetry {
  track(feature: TelemetryFeature): void {
    if (!window._paq) return;

    const { category, action, ...rest } = feature;
    const keys = Object.keys(rest);
    const name = keys.length > 0 ? String((rest as Record<string, unknown>)[keys[0]]) : undefined;
    window._paq.push(name ? ['trackEvent', category, action, name] : ['trackEvent', category, action]);
  }

  pageView(page: VirtualPage): void {
    if (!window._paq) return;

    window._paq.push(['setCustomUrl', page]);
    window._paq.push(['trackPageView']);
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
