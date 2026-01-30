import fastifyPlugin from 'fastify-plugin';
import { metrics } from '@opentelemetry/api';

// @ts-ignore
async function openTelemetryPlugin(fastify) {
  // Get the global meter
  const meter = metrics.getMeter('ui-frontend-bff');

  // Create histogram for response times (will calculate median in Dynatrace)
  const httpServerDuration = meter.createHistogram('http.server.duration', {
    description: 'HTTP request duration in milliseconds',
    unit: 'ms',
  });

  // Create counter for total requests
  const httpServerRequestsTotal = meter.createCounter('http.server.requests.total', {
    description: 'Total number of HTTP requests',
  });

  // Create counter for errors
  const httpServerErrorsTotal = meter.createCounter('http.server.errors.total', {
    description: 'Total number of HTTP errors',
  });

  // Track request start time
  fastify.addHook('onRequest', async (request: any) => {
    request.startTime = Date.now();
  });

  fastify.addHook('onResponse', async (request: any, reply: any) => {
    const duration = Date.now() - request.startTime;

    // Extract route pattern (e.g., /api/users/:id instead of /api/users/123)
    const route = request.routeOptions?.url || request.url || 'unknown';
    const method = request.method;
    const statusCode = reply.statusCode.toString();

    // Common attributes for all metrics
    const attributes: Record<string, string> = {
      'http.method': method,
      'http.route': route,
      'http.status_code': statusCode,
    };

    // Add user context if available
    if (request.encryptedSession) {
      const userId = request.encryptedSession.get('user_id');
      if (userId) {
        attributes['user.id'] = userId;
      }
    }

    // Record response time
    httpServerDuration.record(duration, attributes);

    // Count total requests
    httpServerRequestsTotal.add(1, attributes);

    // Count errors (4xx and 5xx)
    if (reply.statusCode >= 400) {
      httpServerErrorsTotal.add(1, {
        ...attributes,
        'error.type': reply.statusCode >= 500 ? 'server_error' : 'client_error',
      });
    }
  });

  fastify.addHook('onError', async (request: any, _reply: any, error: Error) => {
    const duration = Date.now() - request.startTime;
    const route = request.routeOptions?.url || request.url || 'unknown';
    const method = request.method;

    const attributes: Record<string, string> = {
      'http.method': method,
      'http.route': route,
      'http.status_code': '500',
      'error.type': error.constructor.name,
      'error.message': error.message,
    };

    // Record the duration even for errors
    httpServerDuration.record(duration, attributes);

    // Count the error
    httpServerErrorsTotal.add(1, attributes);
  });
}

export default fastifyPlugin(openTelemetryPlugin);
