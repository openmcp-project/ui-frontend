import type { TelemetryFeature } from './features';

export interface TelemetryUser {
  id: string;
  email?: string;
}

export interface Telemetry {
  track: (feature: TelemetryFeature) => void;
  report: (error: unknown, options?: { message?: string; context?: Record<string, unknown> }) => void;
  identify: (user: TelemetryUser | null) => void;
}
