import { readFileSync } from 'node:fs';
import * as opentelemetry from '@opentelemetry/api';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { MeterProvider, PeriodicExportingMetricReader, AggregationTemporality } from '@opentelemetry/sdk-metrics';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

interface OpenTelemetryConfig {
  endpoint: string;
  token: string;
  serviceName?: string;
  serviceVersion?: string;
  environment?: string;
  debug?: boolean;
}

let tracerProvider: NodeTracerProvider | null = null;
let meterProvider: MeterProvider | null = null;

/**
 * Load Dynatrace metadata from OneAgent enrichment files
 * This ensures proper topology correlation in Dynatrace
 */
function loadDynatraceMetadata(): Resource {
  let dtMetadata = Resource.empty();

  const metadataFiles = [
    'dt_metadata_e617c525669e072eebe3d0f08212e8f2.json',
    '/var/lib/dynatrace/enrichment/dt_metadata.json',
    '/var/lib/dynatrace/enrichment/dt_host_metadata.json',
  ];

  for (const filePath of metadataFiles) {
    try {
      let actualPath = filePath;

      // If it's a relative path, read the file to get the actual path
      if (!filePath.startsWith('/var')) {
        actualPath = readFileSync(filePath, 'utf-8').trim();
      }

      const metadata = JSON.parse(readFileSync(actualPath, 'utf-8'));
      dtMetadata = dtMetadata.merge(Resource.EMPTY.merge(new Resource(metadata)));
      console.log(`[OpenTelemetry] Loaded Dynatrace metadata from: ${actualPath}`);
      break;
    } catch (error) {
      // Continue to next file if this one doesn't exist
    }
  }

  return dtMetadata;
}

export function initializeOpenTelemetry(config: OpenTelemetryConfig): boolean {
  if (!config.endpoint || !config.token) {
    console.log('[OpenTelemetry] OTLP endpoint or token not provided. Skipping initialization.');
    return false;
  }

  if (config.debug) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
  }

  console.log('[OpenTelemetry] Initializing SDK with Dynatrace configuration...');

  // ===== GENERAL SETUP =====

  // Register auto-instrumentations
  registerInstrumentations({
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable unnecessary instrumentations
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-dns': { enabled: false },
        '@opentelemetry/instrumentation-net': { enabled: false },

        // Enable HTTP instrumentation for incoming and outgoing requests
        '@opentelemetry/instrumentation-http': {
          enabled: false,
          ignoreIncomingRequestHook: (request) => {
            const url = request.url || '';
            // Don't create spans for health checks or metrics endpoints
            return url.includes('/health') || url.includes('/metrics');
          },
        },

        // Enable Fastify instrumentation
        '@opentelemetry/instrumentation-fastify': {
          enabled: true,
        },
      }),
    ],
  });

  // Load Dynatrace metadata for topology correlation
  const dtMetadata = loadDynatraceMetadata();

  // Create resource with service information and Dynatrace metadata
  const resource = Resource.default()
    .merge(
      new Resource({
        [ATTR_SERVICE_NAME]: config.serviceName || 'ui-frontend-bff',
        [ATTR_SERVICE_VERSION]: config.serviceVersion || '1.0.0',
      }),
    )
    .merge(dtMetadata);

  // ===== TRACING SETUP =====

  const traceExporter = new OTLPTraceExporter({
    url: `${config.endpoint}/v1/traces`,
    headers: {
      Authorization: `Api-Token ${config.token}`,
    },
  });

  const spanProcessor = new BatchSpanProcessor(traceExporter);

  tracerProvider = new NodeTracerProvider({
    resource: resource,
  });

  tracerProvider.addSpanProcessor(spanProcessor);
  tracerProvider.register();

  console.log('[OpenTelemetry] Trace provider initialized and registered.');

  // ===== METRIC SETUP =====

  const metricExporter = new OTLPMetricExporter({
    url: `${config.endpoint}/v1/metrics`,
    headers: {
      Authorization: `Api-Token ${config.token}`,
    },
    temporalityPreference: AggregationTemporality.DELTA,
  });

  const metricReader = new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 60000, // Export every 60 seconds
  });

  meterProvider = new MeterProvider({
    resource: resource,
    readers: [metricReader],
  });

  // Set this MeterProvider to be global to the app being instrumented
  opentelemetry.metrics.setGlobalMeterProvider(meterProvider);

  console.log('[OpenTelemetry] Meter provider initialized and registered.');

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('[OpenTelemetry] Shutting down SDK...');
    try {
      await tracerProvider?.shutdown();
      await meterProvider?.shutdown();
      console.log('[OpenTelemetry] SDK shut down successfully.');
    } catch (error) {
      console.error('[OpenTelemetry] Error shutting down SDK:', error);
    }
  });

  return true;
}
