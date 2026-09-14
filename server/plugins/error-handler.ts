import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { ApplicationError } from '../errors.js';
import '../telemetry/telemetry.js';

const isFastifyClientError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const fastifyError = error as { statusCode?: number; validation?: unknown };
  return (
    Boolean(fastifyError.validation) ||
    (typeof fastifyError.statusCode === 'number' && fastifyError.statusCode >= 400 && fastifyError.statusCode < 500)
  );
};

const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof ApplicationError) {
      const context = { code: error.code, ...error.context };

      if (error.report) {
        request.telemetry.report(error, { message: error.message, context });
      } else if (error.logLevel === 'warn') {
        request.log.warn(context, error.message);
      } else {
        request.log.info(context, error.message);
      }

      return reply.code(error.statusCode).send({ error: error.publicMessage });
    }

    // Preserve Fastify validation errors and deliberate 4xx responses from
    // plugins such as @fastify/sensible and @fastify/rate-limit.
    if (isFastifyClientError(error)) {
      return reply.send(error);
    }

    // Sentry's native Fastify v5 integration captures this thrown error. Keep
    // the HTTP boundary responsible only for the request-scoped log and response.
    request.log.error({ err: error }, 'Unhandled request error.');
    return reply.code(500).send({ error: 'Internal Server Error' });
  });
};

export default fp(errorHandlerPlugin, {
  fastify: '5.x',
  name: 'error-handler',
  dependencies: ['server-telemetry'],
});
