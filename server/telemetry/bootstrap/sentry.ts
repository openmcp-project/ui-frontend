import * as Sentry from '@sentry/node';
import type { FastifyInstance } from 'fastify';

export function initSentry(): void {
  if (!process.env.BFF_SENTRY_DSN || process.env.BFF_SENTRY_DSN.trim() === '') {
    console.error('Error: Sentry DSN is not provided. Sentry will not be initialized.');
    return;
  }

  Sentry.init({
    dsn: process.env.BFF_SENTRY_DSN,
    environment: process.env.FRONTEND_SENTRY_ENVIRONMENT,
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

export function setupSentryErrorHandler(fastify: FastifyInstance): void {
  Sentry.setupFastifyErrorHandler(fastify);
}
