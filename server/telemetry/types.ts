export interface ServerTelemetry {
  report: (error: unknown, options?: { message?: string; context?: Record<string, unknown> }) => void;
  breadcrumb: (message: string, options?: { level?: 'info' | 'warning'; context?: Record<string, unknown> }) => void;
}
