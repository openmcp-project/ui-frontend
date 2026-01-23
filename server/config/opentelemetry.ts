import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

interface OpenTelemetryConfig {
  endpoint: string;
  token: string;
  serviceName?: string;
  serviceVersion?: string;
  environment?: string;
  debug?: boolean;
}

let sdk: NodeSDK | null = null;

export function initializeOpenTelemetry(config: OpenTelemetryConfig): NodeSDK | null {
  if (!config.endpoint || !config.token) {
    console.log('[OpenTelemetry] OTLP endpoint or token not provided. Skipping initialization.');
    return null;
  }

  if (config.debug) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
  }

  console.log('[OpenTelemetry] Initializing SDK...');

  const resource = new Resource({
    [ATTR_SERVICE_NAME]: config.serviceName || 'ui-frontend-bff',
    [ATTR_SERVICE_VERSION]: config.serviceVersion || '1.0.0',
  });

  const traceExporter = new OTLPTraceExporter({
    url: `${config.endpoint}/v1/traces`,
    headers: {
      Authorization: `Api-Token ${config.token}`,
    },
  });

  sdk = new NodeSDK({
    resource,
    traceExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-dns': { enabled: false },
        '@opentelemetry/instrumentation-net': { enabled: false },
        '@opentelemetry/instrumentation-http': {
          enabled: true,

          ignoreIncomingRequestHook: () => true,
        },

        '@opentelemetry/instrumentation-fastify': {
          enabled: true,
        },
      }),
    ],
  });

  sdk.start();
  console.log('[OpenTelemetry] SDK initialized successfully.');

  process.on('SIGTERM', async () => {
    console.log('[OpenTelemetry] Shutting down SDK...');
    try {
      await sdk?.shutdown();
      console.log('[OpenTelemetry] SDK shut down successfully.');
    } catch (error) {
      console.error('[OpenTelemetry] Error shutting down SDK:', error);
    }
  });

  return sdk;
}
