import { TelemetryService } from './TelemetryService';
import { ConsoleAdapter } from './adapters/ConsoleAdapter';
import { DynatraceAdapter } from './adapters/DynatraceAdapter';
import { SentryAdapter } from './adapters/SentryAdapter';
import { MatomoAdapter } from './adapters/MatomoAdapter.ts';
import type { Telemetry } from './types';

const buildAdapters = (): Telemetry[] => {
  const adapters: Telemetry[] = [
    // ── Telemetry providers ─────────────────────────────
    new SentryAdapter(),
    new DynatraceAdapter(),
    new MatomoAdapter(),
  ];

  if (import.meta.env.DEV) {
    // Dev-only (localhost)
    adapters.push(new ConsoleAdapter());
  }

  return adapters;
};

const instance: Telemetry = new TelemetryService(buildAdapters());

export const telemetry = (): Telemetry => instance;

export const useTelemetry = (): Telemetry => telemetry();
