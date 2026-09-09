import * as Sentry from '@sentry/node';
import type { ServerTelemetry } from '../types.js';

export class SentryServerAdapter implements ServerTelemetry {
  report(error: unknown, options?: { message?: string; context?: Record<string, unknown> }): void {
    Sentry.captureException(error, {
      extra: {
        ...(options?.message !== undefined && { message: options.message }),
        ...options?.context,
      },
    });
  }

  breadcrumb(message: string, options?: { level?: 'info' | 'warning'; context?: Record<string, unknown> }): void {
    Sentry.addBreadcrumb({
      message,
      level: options?.level ?? 'info',
      category: 'diagnostic',
      ...(options?.context !== undefined && { data: options.context }),
    });
  }
}
