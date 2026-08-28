import * as Sentry from '@sentry/node';
import { ApplicationError } from '../../errors.js';

export function initSentry(): void {
  if (!process.env.BFF_SENTRY_DSN || process.env.BFF_SENTRY_DSN.trim() === '') {
    console.error('Error: Sentry DSN is not provided. Sentry will not be initialized.');
    return;
  }

  Sentry.init({
    dsn: process.env.BFF_SENTRY_DSN,
    environment: process.env.FRONTEND_SENTRY_ENVIRONMENT,
    integrations(defaultIntegrations) {
      return [
        ...defaultIntegrations.filter((integration) => integration.name !== 'Fastify'),
        Sentry.fastifyIntegration({
          shouldHandleError(error, _request, reply) {
            if (error instanceof ApplicationError) {
              // Application errors are handled explicitly by the HTTP error
              // boundary so their safe context can be included exactly once.
              return false;
            }
            return reply.statusCode >= 500 || reply.statusCode <= 299;
          },
        }),
      ];
    },
    beforeSend(event) {
      if (event.request && event.request.cookies) {
        event.request.cookies = Object.keys(event.request.cookies).reduce((acc, key) => {
          // @ts-ignore
          acc[key] = '';
          return acc;
        }, {});
      }
      return event;
    },
  });
}
