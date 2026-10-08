import type { TelemetryFeature } from './features';
import type { VirtualPage } from './pageView/virtualPage';

export interface TelemetryUser {
  id: string;
  email?: string;
}

export interface Telemetry {
  track: (feature: TelemetryFeature) => void;
  pageView: (page: VirtualPage) => void;
  report: (error: unknown, options?: { message?: string; context?: Record<string, unknown> }) => void;
  breadcrumb: (message: string, options?: { level?: 'info' | 'warning'; context?: Record<string, unknown> }) => void;
  identify: (user: TelemetryUser | null) => void;
}
