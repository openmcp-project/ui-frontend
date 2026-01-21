import dotenv from 'dotenv';

dotenv.config();

import { initializeOpenTelemetry } from './config/opentelemetry.js';

const { DYNATRACE_OTLP_ENDPOINT, DYNATRACE_OTLP_TOKEN, NODE_ENV } = process.env;

if (DYNATRACE_OTLP_ENDPOINT && DYNATRACE_OTLP_TOKEN) {
  initializeOpenTelemetry({
    endpoint: DYNATRACE_OTLP_ENDPOINT,
    token: DYNATRACE_OTLP_TOKEN,
    serviceName: 'ui-frontend-bff',
    serviceVersion: process.env.npm_package_version || '1.0.0',
    environment: NODE_ENV || 'production',
    debug: NODE_ENV === 'development',
  });
} else {
  console.log('[OpenTelemetry] Skipping initialization - DYNATRACE_OTLP_ENDPOINT or DYNATRACE_OTLP_TOKEN not set');
}
