import * as Sentry from '@sentry/react';
import type { Telemetry, TelemetryUser } from '../types';
import type { TelemetryFeature } from '../features';

export class SentryAdapter implements Telemetry {
  track(feature: TelemetryFeature): void {
    Sentry.addBreadcrumb({
      message: feature.name,
      data: feature,
      category: 'ui',
      level: 'info',
    });
  }

  report(error: unknown, options?: { message?: string; context?: Record<string, unknown> }): void {
    Sentry.captureException(error, {
      extra: {
        ...(options?.message !== undefined && { message: options.message }),
        ...options?.context,
      },
    });
  }

  identify(user: TelemetryUser | null): void {
    Sentry.setUser(user ? { id: user.id, ...(user.email !== undefined && { email: user.email }) } : null);
    Sentry.addBreadcrumb({
      message: user ? 'User identified' : 'User cleared',
      category: 'auth',
      level: 'info',
    });
  }
}
