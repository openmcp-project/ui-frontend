import type { Telemetry, TelemetryUser } from '../types';
import type { TelemetryFeature } from '../features';
import '../bootstrap/dynatrace';

export class DynatraceAdapter implements Telemetry {
  track(feature: TelemetryFeature): void {
    if (!window.dtrum) return;

    const actionId = window.dtrum.enterAction(feature.name, 'feature');
    try {
      const { name: _, ...rest } = feature;
      const stringProps = Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, String(v)]));
      if (Object.keys(stringProps).length > 0) {
        window.dtrum.addActionProperties(actionId, undefined, undefined, stringProps);
      }
    } finally {
      window.dtrum.leaveAction(actionId);
    }
  }

  report(error: unknown, options?: { message?: string; context?: Record<string, unknown> }): void {
    if (!window.dtrum) return;

    const cause = error instanceof Error ? error.message : String(error);
    const prefix = options?.message ?? 'Error';
    window.dtrum.reportError(`${prefix}: ${cause}`);
  }

  identify(user: TelemetryUser | null): void {
    if (!window.dtrum) return;

    window.dtrum.identifyUser(user?.id ?? '');
  }
}
