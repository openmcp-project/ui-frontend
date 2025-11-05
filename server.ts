import Fastify from 'fastify';
import FastifyVite from '@fastify/vite';
import helmet from '@fastify/helmet';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';
import proxy from './server/app.js';
import envPlugin from './server/config/env.js';
import { copyFileSync } from 'node:fs';
import * as Sentry from '@sentry/node';
import { injectDynatraceTag } from './server/config/dynatrace.js';

dotenv.config();

console.log(process.env);

const { DYNATRACE_SCRIPT_URL } = process.env;
if (DYNATRACE_SCRIPT_URL) {
  injectDynatraceTag(DYNATRACE_SCRIPT_URL);
}

if (!process.env.BFF_SENTRY_DSN || process.env.BFF_SENTRY_DSN.trim() === '') {
  console.error('Error: Sentry DSN is not provided. Sentry will not be initialized.');
} else {
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

const isLocalDev = process.argv.includes('--local-dev');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Make frontend configuration available (frontend-config.json)
const frontendConfigLocation = isLocalDev ? 'public/frontend-config.json' : 'dist/client/frontend-config.json';
if (process.env.FRONTEND_CONFIG_PATH !== undefined && process.env.FRONTEND_CONFIG_PATH.length > 0) {
  console.log('FRONTEND_CONFIG_PATH is specified. Will copy the frontend-config from there.');
  console.log(`  Copying ${process.env.FRONTEND_CONFIG_PATH} to ${frontendConfigLocation}`);
  copyFileSync(process.env.FRONTEND_CONFIG_PATH, frontendConfigLocation);
}

// Make hyperspace portal configuration available (hyperspace-portal-config.json)
if (
  !isLocalDev &&
  process.env.HYPERSPACE_PORTAL_CONFIG_PATH !== undefined &&
  process.env.HYPERSPACE_PORTAL_CONFIG_PATH.length > 0
) {
  const hyperspacePortalConfigLocation = 'dist/client/hyperspace-portal-config.json';
  console.log('HYPERSPACE_PORTAL_CONFIG_PATH is specified. Will copy the hyperspace-portal-config from there.');
  console.log(`  Copying ${process.env.HYPERSPACE_PORTAL_CONFIG_PATH} to ${hyperspacePortalConfigLocation}`);
  copyFileSync(process.env.HYPERSPACE_PORTAL_CONFIG_PATH, hyperspacePortalConfigLocation);
}

const fastify = Fastify({
  logger: true,
});

Sentry.setupFastifyErrorHandler(fastify);
await fastify.register(envPlugin);

let sentryHost = '';
// @ts-ignore
if (fastify.config.FRONTEND_SENTRY_DSN && fastify.config.FRONTEND_SENTRY_DSN.length > 0) {
  try {
    // @ts-ignore
    sentryHost = new URL(fastify.config.FRONTEND_SENTRY_DSN).hostname;
  } catch {
    console.log('FRONTEND_SENTRY_DSN is not a valid URL');
    sentryHost = '';
  }
}

let dynatraceOrigin = '';
if (DYNATRACE_SCRIPT_URL) {
  try {
    dynatraceOrigin = new URL(DYNATRACE_SCRIPT_URL).origin;
  } catch {
    console.error('DYNATRACE_SCRIPT_URL is not a valid URL');
  }
}

fastify.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'", 'sdk.openui5.org', sentryHost, dynatraceOrigin],
      'script-src': isLocalDev
        ? ["'self'", "'unsafe-inline'", "'unsafe-eval'", sentryHost, dynatraceOrigin]
        : ["'self'", sentryHost, dynatraceOrigin],
      // @ts-ignore
      'frame-ancestors': [...fastify.config.FRAME_ANCESTORS.split(',')],
    },
  },
  // Needed for https enforcement
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

fastify.register(proxy, {
  prefix: '/api',
});

await fastify.register(FastifyVite, {
  root: __dirname,
  dev: isLocalDev,
  spa: true,
});

fastify.get('/sentry', function (req, reply) {
  return reply.send({
    // @ts-ignore
    FRONTEND_SENTRY_DSN: fastify.config.FRONTEND_SENTRY_DSN,
    // @ts-ignore
    FRONTEND_SENTRY_ENVIRONMENT: fastify.config.FRONTEND_SENTRY_ENVIRONMENT,
  });
});

// @ts-ignore
fastify.get('/', function (req, reply) {
  return reply.html();
});

await fastify.vite.ready();
fastify.listen(
  {
    port: 5173,
    host: '0.0.0.0',
  },
  // @ts-ignore
  function (err, address) {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  },
);
