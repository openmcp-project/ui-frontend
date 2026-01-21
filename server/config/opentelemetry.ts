import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import type { IncomingMessage } from 'node:http';

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
  // Validate required configuration
  if (!config.endpoint || !config.token) {
    console.log('[OpenTelemetry] OTLP endpoint or token not provided. Skipping initialization.');
    return null;
  }

  // Enable debug logging in development
  if (config.debug) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
  }

  console.log('[OpenTelemetry] Initializing SDK...');

  // Configure resource attributes
  const resource = new Resource({
    [ATTR_SERVICE_NAME]: config.serviceName || 'ui-frontend-bff',
    [ATTR_SERVICE_VERSION]: config.serviceVersion || '1.0.0',
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: config.environment || 'production',
  });

  // Configure OTLP trace exporter
  const traceExporter = new OTLPTraceExporter({
    url: `${config.endpoint}/v1/traces`,
    headers: {
      Authorization: `Api-Token ${config.token}`,
    },
  });

  // Initialize SDK with auto-instrumentations
  sdk = new NodeSDK({
    resource,
    traceExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable unnecessary instrumentations
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-dns': { enabled: false },
        '@opentelemetry/instrumentation-net': { enabled: false },
        // Configure HTTP instrumentation carefully to avoid breaking Fastify
        '@opentelemetry/instrumentation-http': {
          enabled: true,
          // Disable incoming request instrumentation - Fastify instrumentation handles this
          // This prevents conflicts with query parameter parsing
          ignoreIncomingPaths: [/.*/],
          ignoreIncomingRequestHook: () => true, // Ignore all incoming requests
          // Only instrument outgoing requests (to API backend, etc.)
        },
        // Enable Fastify instrumentation for incoming requests
        // This properly handles Fastify's request lifecycle
        '@opentelemetry/instrumentation-fastify': {
          enabled: true,
        },
      }),
    ],
  });

  // Start the SDK
  sdk.start();
  console.log('[OpenTelemetry] SDK initialized successfully.');

  // Handle graceful shutdown
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

export function getSDK(): NodeSDK | null {
  return sdk;
}

export async function shutdown(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
    sdk = null;
  }
}
