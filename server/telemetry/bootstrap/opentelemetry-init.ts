import 'dotenv/config';

import { DiagLogLevel } from '@opentelemetry/api';
import { initializeOpenTelemetry } from './opentelemetry-config.js';
import { logger } from '../../logger.js';

const log = logger.child({ component: 'opentelemetry' });

const OTEL_LOG_LEVEL_MAP: Record<string, DiagLogLevel> = {
  none: DiagLogLevel.NONE,
  error: DiagLogLevel.ERROR,
  warn: DiagLogLevel.WARN,
  info: DiagLogLevel.INFO,
  debug: DiagLogLevel.DEBUG,
  verbose: DiagLogLevel.VERBOSE,
  all: DiagLogLevel.ALL,
};

const otelLogLevelName = (process.env.OTEL_LOG_LEVEL ?? 'warn').toLowerCase();
const otelDiagLevel = OTEL_LOG_LEVEL_MAP[otelLogLevelName] ?? DiagLogLevel.WARN;

const { DYNATRACE_OTLP_ENDPOINT, DYNATRACE_OTLP_TOKEN, NODE_ENV } = process.env;

if (DYNATRACE_OTLP_ENDPOINT && DYNATRACE_OTLP_TOKEN) {
  initializeOpenTelemetry({
    endpoint: DYNATRACE_OTLP_ENDPOINT,
    token: DYNATRACE_OTLP_TOKEN,
    serviceName: process.env.OTEL_SERVICE_NAME ?? 'ui-frontend-bff',
    serviceVersion: process.env.npm_package_version || '1.0.0',
    environment: NODE_ENV || 'production',
    diagLogLevel: otelDiagLevel,
  });
} else {
  log.info('Skipping initialization - DYNATRACE_OTLP_ENDPOINT or DYNATRACE_OTLP_TOKEN not set');
}
