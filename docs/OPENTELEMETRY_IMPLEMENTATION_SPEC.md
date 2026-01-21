# OpenTelemetry Integration with Dynatrace - Implementation Specification

## Overview

This document outlines the implementation of OpenTelemetry instrumentation for the **Fastify backend (BFF)** with Dynatrace as the telemetry data destination. The implementation will track HTTP request performance, errors, distributed traces, and proxy calls to the API backend.

## Architecture

### Current State
- **Backend Framework**: Fastify (Node.js) serving as BFF (Backend for Frontend)
- **Current Monitoring**: Sentry for error tracking
- **Language**: TypeScript with ES Modules
- **Key Components**: 
  - Authentication routes (MCP, Onboarding)
  - HTTP Proxy to API backend (`/onboarding` prefix)
  - Feedback routes
  - Static file serving
  - Session management with encrypted sessions

### Target State
- Add OpenTelemetry instrumentation for backend observability
- Export telemetry data to Dynatrace OTLP endpoint
- Track:
  - HTTP requests (incoming to BFF and outgoing to API backend)
  - Response times and latency
  - Errors and exceptions
  - Proxy requests
  - Authentication flows
- Maintain existing Sentry integration (both can coexist)

## Environment Variables

Add two new environment variables for Dynatrace OTLP integration:

### 1. DYNATRACE_OTLP_ENDPOINT
- **Description**: Dynatrace OTLP/HTTP endpoint URL
- **Format**: `https://{your-environment-id}.live.dynatrace.com/api/v2/otlp`
- **Example**: `https://abc12345.live.dynatrace.com/api/v2/otlp`
- **Required**: No (optional, telemetry disabled if not provided)

### 2. DYNATRACE_OTLP_TOKEN
- **Description**: Dynatrace API token with OTLP ingest permissions
- **Format**: `dt0c01.{rest-of-token}`
- **Required**: No (optional, telemetry disabled if not provided)
- **Token Permissions Required**:
  - `openTelemetryTrace.ingest`
  - `metrics.ingest` (optional, if you want metrics)

### Update `.env` file:
```bash
# Existing variables
BFF_SENTRY_DSN=...
FRONTEND_SENTRY_DSN=...
# ...

# New: OpenTelemetry OTLP Export for BFF
DYNATRACE_OTLP_ENDPOINT=https://abc12345.live.dynatrace.com/api/v2/otlp
DYNATRACE_OTLP_TOKEN=dt0c01.ABC...XYZ
```

## Dependencies

### Required NPM Packages

Add the following dependencies to `package.json`:

```json
{
  "dependencies": {
    "@opentelemetry/api": "1.9.0",
    "@opentelemetry/sdk-node": "0.57.2",
    "@opentelemetry/auto-instrumentations-node": "0.54.0",
    "@opentelemetry/exporter-trace-otlp-http": "0.57.2",
    "@opentelemetry/resources": "1.30.0",
    "@opentelemetry/semantic-conventions": "1.30.0"
  }
}
```

**Note**: Metrics exporter removed as we're focusing on traces only for initial implementation.

### Installation Command
```bash
npm install @opentelemetry/api@1.9.0 \
  @opentelemetry/sdk-node@0.57.2 \
  @opentelemetry/auto-instrumentations-node@0.54.0 \
  @opentelemetry/exporter-trace-otlp-http@0.57.2 \
  @opentelemetry/resources@1.30.0 \
  @opentelemetry/semantic-conventions@1.30.0
```

## Implementation Steps

### Step 1: Update Environment Configuration Schema

**File**: `server/config/env.ts`

Add the new Dynatrace OTLP environment variables to the schema:

```typescript
const schema = {
  type: 'object',
  required: [
    // ...existing required fields
  ],
  properties: {
    // ...existing properties
    DYNATRACE_OTLP_ENDPOINT: { type: 'string' },
    DYNATRACE_OTLP_TOKEN: { type: 'string' },
  },
};
```

**Note**: These are NOT in the required array as they are optional.

### Step 2: Create OpenTelemetry Initialization Module

**File**: `server/config/opentelemetry.ts` (NEW FILE)

Create a new module to initialize OpenTelemetry. This file must be imported and called **before** any other modules to ensure proper auto-instrumentation:

```typescript
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
        // Enable HTTP instrumentation for outgoing requests
        '@opentelemetry/instrumentation-http': {
          enabled: true,
          ignoreIncomingRequestHook: (request) => {
            // Ignore health check endpoints if you have any
            const url = request.url || '';
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
```

### Step 3: Update Main Server File

**File**: `server.ts`

Initialize OpenTelemetry **at the very beginning** of the file, before any other imports that need to be instrumented:

```typescript
import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

// Initialize OpenTelemetry BEFORE importing Fastify and other modules
// This is critical for auto-instrumentation to work properly
import { initializeOpenTelemetry } from './server/config/opentelemetry.js';

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
}

// NOW import Fastify and other modules (they will be auto-instrumented)
import Fastify from 'fastify';
import FastifyVite from '@fastify/vite';
// ...existing imports...
```

**Critical Note**: The order is important:
1. Import dotenv and load config
2. Import and initialize OpenTelemetry
3. Import everything else (Fastify, plugins, etc.)

### Step 4: Add Custom Tracing Hooks (Optional but Recommended)

**File**: `server/plugins/opentelemetry.ts` (NEW FILE)

Create a Fastify plugin to enrich traces with custom attributes:

```typescript
import fastifyPlugin from 'fastify-plugin';
import { trace, SpanStatusCode } from '@opentelemetry/api';

// @ts-ignore
async function openTelemetryPlugin(fastify) {
  // Add hooks to enrich spans with custom attributes
  fastify.addHook('onRequest', async (request: any) => {
    const span = trace.getActiveSpan();
    if (span) {
      // Add request ID for correlation
      span.setAttribute('request.id', request.id);
      
      // Add user context if available in session
      if (request.encryptedSession) {
        const userId = request.encryptedSession.get('user_id');
        const userEmail = request.encryptedSession.get('user_email');
        if (userId) span.setAttribute('user.id', userId);
        if (userEmail) span.setAttribute('user.email', userEmail);
      }

      // Track which authentication flow is being used
      const useCrate = request.headers['x-use-crate'];
      if (useCrate) {
        span.setAttribute('auth.use_crate', useCrate === 'true');
      }
    }
  });

  fastify.addHook('onResponse', async (request: any, reply: any) => {
    const span = trace.getActiveSpan();
    if (span) {
      // Mark 4xx and 5xx as errors
      if (reply.statusCode >= 400) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `HTTP ${reply.statusCode}`,
        });
        span.setAttribute('error', true);
      }
    }
  });

  fastify.addHook('onError', async (request: any, reply: any, error: Error) => {
    const span = trace.getActiveSpan();
    if (span) {
      // Record exception details
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      span.setAttribute('error.type', error.constructor.name);
      span.setAttribute('error.message', error.message);
      if (error.stack) {
        span.setAttribute('error.stack', error.stack);
      }
    }
  });
}

export default fastifyPlugin(openTelemetryPlugin);
```

### Step 5: Register OpenTelemetry Plugin

**File**: `server/app.ts`

Register the OpenTelemetry plugin early in the plugin chain:

```typescript
// ...existing imports...
import openTelemetryPlugin from './plugins/opentelemetry.js';

export default async function (fastify: any, opts: any) {
  // Register OpenTelemetry plugin first to capture all requests
  await fastify.register(openTelemetryPlugin, opts);
  
  fastify.register(encryptedSession, {
    ...opts,
  });

  // ...existing code...
}
```

## What Will Be Tracked

### Automatic Instrumentation (Out of the Box):

1. **Incoming HTTP Requests to BFF**
   - All routes (authentication, feedback, proxy, static files)
   - Request method, URL, headers
   - Response status codes
   - Request duration

2. **Outgoing HTTP Requests from BFF**
   - Proxy calls to API backend (`/onboarding` routes)
   - OAuth token refresh calls
   - Any external API calls

3. **Fastify-Specific Metrics**
   - Route handlers
   - Middleware execution
   - Plugin lifecycle

4. **Errors and Exceptions**
   - Stack traces
   - Error types
   - HTTP error responses

### Custom Attributes Added:

- `request.id` - Fastify request ID for correlation
- `user.id` - User ID from session (if available)
- `user.email` - User email from session (if available)
- `auth.use_crate` - Authentication flow indicator
- `error.type` - Error class name
- `error.message` - Error message
- `error.stack` - Stack trace (on errors)

## Testing the Implementation

### 1. Local Development Setup

Create or update `.env.local`:
```bash
DYNATRACE_OTLP_ENDPOINT=https://your-env.live.dynatrace.com/api/v2/otlp
DYNATRACE_OTLP_TOKEN=dt0c01.YOUR_TOKEN_HERE
NODE_ENV=development
```

### 2. Run Development Server

```bash
npm run dev
```

### 3. Verify Initialization

Check console output for:
```
[OpenTelemetry] Initializing SDK...
[OpenTelemetry] SDK initialized successfully.
```

### 4. Generate Test Traffic

```bash
# Test various endpoints
curl http://localhost:5173/
curl http://localhost:5173/api/onboarding/...
curl http://localhost:5173/auth/login
```

### 5. Verify in Dynatrace

1. Log into Dynatrace
2. Navigate to **Services**
3. Find service: `ui-frontend-bff`
4. Check:
   - **Distributed traces** - See incoming requests
   - **Service flow** - Visualize BFF → API backend calls
   - **Failures** - Check error tracking
   - **Response time** - View performance metrics

### 6. Expected Trace Structure

You should see traces like:
```
GET /onboarding/apis/core.openmcp.cloud/v1alpha1/...
  ├─ Fastify middleware
  ├─ Authentication check
  ├─ HTTP GET to API_BACKEND_URL (outgoing)
  └─ Response
```

## Integration with Existing Monitoring

### Coexistence with Sentry

OpenTelemetry and Sentry can run simultaneously:

- **Sentry**: Continues to capture errors with rich context, user feedback, releases
- **OpenTelemetry**: Provides distributed tracing, performance monitoring, request flows

Both send data independently and complement each other.

### Performance Impact

- **Overhead**: Typically < 5% CPU and memory
- **Network**: Traces batched and sent asynchronously
- **Graceful degradation**: If Dynatrace is unreachable, traces are dropped, app continues

## Security Considerations

### 1. Credential Management
- ✅ Store tokens in environment variables only
- ✅ Never commit `.env` files to Git
- ✅ Use secret management in production (e.g., Kubernetes secrets, AWS Secrets Manager)
- ✅ Rotate tokens regularly

### 2. Data Privacy
- ⚠️ Review session data being added to spans
- ⚠️ Avoid logging sensitive PII (passwords, tokens, credit cards)
- ⚠️ The current implementation logs `user.id` and `user.email` - adjust if needed for GDPR compliance

### 3. Network Security
- ✅ All data sent over HTTPS to Dynatrace
- ✅ Authentication via API token

## Troubleshooting

### Issue: No traces appearing in Dynatrace

**Solutions:**
1. Check initialization log message appears
2. Verify endpoint URL ends with `/api/v2/otlp` (without `/v1/traces`)
3. Verify token has `openTelemetryTrace.ingest` permission
4. Check network connectivity: `curl -I https://your-env.live.dynatrace.com`
5. Enable debug mode: Set `NODE_ENV=development`
6. Check for export errors in server logs

### Issue: Traces appear but missing custom attributes

**Solutions:**
1. Verify OpenTelemetry plugin is registered in `server/app.ts`
2. Check session structure matches expected keys
3. Add console.log in hooks to debug span context
4. Ensure auto-instrumentation is working (check for HTTP spans first)

### Issue: High memory usage

**Solutions:**
1. Disable debug logging in production
2. Reduce trace retention (configure in Dynatrace)
3. Add sampling if needed (see Advanced Configuration)

### Issue: OpenTelemetry initialized but Fastify not instrumented

**Solution:**
- Ensure OpenTelemetry is initialized **before** `import Fastify` statement
- The import order in `server.ts` is critical

## Advanced Configuration (Optional)

### Sampling

To reduce trace volume, add sampling in `server/config/opentelemetry.ts`:

```typescript
import { TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';

// Add to NodeSDK config:
sampler: new TraceIdRatioBasedSampler(0.1), // Sample 10% of traces
```

### Custom Span for Specific Operations

Create `server/utils/tracing.ts`:

```typescript
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('ui-frontend-bff');

export async function withSpan<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string>
): Promise<T> {
  const span = tracer.startSpan(name);
  
  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      span.setAttribute(key, value);
    });
  }
  
  return context.with(trace.setSpan(context.active(), span), async () => {
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      span.end();
    }
  });
}
```

Usage example in a route:
```typescript
import { withSpan } from '../utils/tracing.js';

fastify.get('/example', async (request, reply) => {
  return withSpan('custom-operation', async () => {
    // Your logic here
    return { data: 'result' };
  }, { 'operation.type': 'data-fetch' });
});
```

## Deployment Checklist

### Development Environment
- [ ] Install OpenTelemetry packages
- [ ] Create `server/config/opentelemetry.ts`
- [ ] Create `server/plugins/opentelemetry.ts`
- [ ] Update `server/config/env.ts`
- [ ] Update `server.ts` (initialization order)
- [ ] Update `server/app.ts` (register plugin)
- [ ] Set environment variables in `.env.local`
- [ ] Test locally and verify traces in Dynatrace

### Staging Environment
- [ ] Set `DYNATRACE_OTLP_ENDPOINT` in staging config
- [ ] Set `DYNATRACE_OTLP_TOKEN` in staging secrets
- [ ] Deploy to staging
- [ ] Verify traces appear with correct environment tag
- [ ] Monitor for errors or performance issues
- [ ] Test authentication flows and proxy requests

### Production Environment
- [ ] Set `DYNATRACE_OTLP_ENDPOINT` in production config
- [ ] Set `DYNATRACE_OTLP_TOKEN` in production secrets
- [ ] Update deployment manifests (Kubernetes, Docker, etc.)
- [ ] Deploy to production
- [ ] Monitor initialization logs
- [ ] Verify traces in Dynatrace production environment
- [ ] Set up alerts in Dynatrace for error rates
- [ ] Document for team

## File Structure Summary

```
server/
├── config/
│   ├── env.ts (UPDATED - add OTLP env vars)
│   ├── opentelemetry.ts (NEW - initialization logic)
│   └── dynatrace.ts (existing - RUM injection)
├── plugins/
│   ├── opentelemetry.ts (NEW - Fastify hooks)
│   ├── http-proxy.ts (existing - auto-instrumented)
│   └── ...
├── utils/
│   └── tracing.ts (OPTIONAL - custom spans)
└── app.ts (UPDATED - register plugin)

server.ts (UPDATED - initialization order)
.env (UPDATED - add OTLP credentials)
package.json (UPDATED - add dependencies)
```

## References

- [OpenTelemetry JS Documentation](https://opentelemetry.io/docs/languages/js/)
- [OpenTelemetry Node SDK](https://github.com/open-telemetry/opentelemetry-js/tree/main/experimental/packages/opentelemetry-sdk-node)
- [Dynatrace OpenTelemetry](https://docs.dynatrace.com/docs/extend-dynatrace/opentelemetry)
- [Fastify Instrumentation](https://github.com/open-telemetry/opentelemetry-js-contrib/tree/main/plugins/node/opentelemetry-instrumentation-fastify)
- [OTLP HTTP Exporter](https://github.com/open-telemetry/opentelemetry-js/tree/main/experimental/packages/exporter-trace-otlp-http)

---

**Document Version**: 2.0  
**Last Updated**: January 21, 2025  
**Focus**: Fastify Backend Only  
**Review Status**: Ready for Implementation
