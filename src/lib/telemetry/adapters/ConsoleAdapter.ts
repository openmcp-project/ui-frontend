import type { Telemetry, TelemetryUser } from '../types';
import type { TelemetryFeature } from '../features';
import { UNKNOWN_PAGE, type VirtualPage } from '../pageView/virtualPage';

type Namespace = 'track' | 'pageview' | 'breadcrumb' | 'identify';

function enabledNamespaces(): Set<Namespace> | 'all' {
  try {
    const raw = localStorage.getItem('ocp.debug');
    if (!raw) return new Set();
    if (raw.trim() === '*') return 'all';
    const names = raw.split(',').map((s) => s.trim().toLowerCase()) as Namespace[];
    const valid: Namespace[] = ['track', 'pageview', 'breadcrumb', 'identify'];
    return new Set(names.filter((n) => valid.includes(n)));
  } catch {
    return new Set();
  }
}

function isEnabled(ns: Namespace): boolean {
  const enabled = enabledNamespaces();
  return enabled === 'all' || enabled.has(ns);
}

export class ConsoleAdapter implements Telemetry {
  constructor() {
    console.debug(
      '[Telemetry] Console output is off by default. Enable with: localStorage.setItem("ocp.debug", "track,pageview,breadcrumb,identify") or "*" for all.',
    );
  }

  track(feature: TelemetryFeature): void {
    if (!isEnabled('track')) return;
    const { category, action, ...rest } = feature;
    console.info('[Telemetry] track', `${category}.${action}`, rest);
  }

  pageView(page: VirtualPage): void {
    if (page === UNKNOWN_PAGE) {
      console.warn('[Telemetry] pageView: route not declared in Routes.ts, reported as', page);
      return;
    }
    if (!isEnabled('pageview')) return;
    console.info('[Telemetry] pageView', page);
  }

  report(error: unknown, options?: { message?: string; context?: Record<string, unknown> }): void {
    console.error('[Telemetry] report', options?.message ?? 'Error', error, options?.context ?? {});
  }

  breadcrumb(message: string, options?: { level?: 'info' | 'warning'; context?: Record<string, unknown> }): void {
    if (!isEnabled('breadcrumb')) return;
    console.debug('[Telemetry] breadcrumb', message, options?.level ?? 'info', options?.context ?? {});
  }

  identify(user: TelemetryUser | null): void {
    if (!isEnabled('identify')) return;
    if (user) {
      console.info('[Telemetry] identify', user.id);
    }
  }
}
