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

  fastify.addHook('onResponse', async (_request: any, reply: any) => {
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

  fastify.addHook('onError', async (_request: any, _reply: any, error: Error) => {
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
