import Fastify from 'fastify';
import FastifyVite from '@fastify/vite';
import helmet from '@fastify/helmet';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';
import proxy from './server/app.js';
import envPlugin from "./server/config/env.js";
import { copyFileSync } from 'node:fs';
import * as Sentry from '@sentry/node';

dotenv.config();

Sentry.init({
  dsn: process.env.BFF_SENTRY_DSN,
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  environment: process.env.VITE_ENVIRONMENT,
});

const isLocalDev = process.argv.includes('--local-dev');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendConfigLocation = isLocalDev
  ? 'public/frontend-config.json'
  : 'dist/client/frontend-config.json';

if (process.env.FRONTEND_CONFIG_PATH !== undefined && process.env.FRONTEND_CONFIG_PATH.length > 0) {
  console.log('FRONTEND_CONFIG_PATH is specified. Will copy the frontend-config from there.');
  console.log(`  Copying ${process.env.FRONTEND_CONFIG_PATH} to ${frontendConfigLocation}`);
  copyFileSync(process.env.FRONTEND_CONFIG_PATH, frontendConfigLocation);
}

const fastify = Fastify({
  logger: true,
});

Sentry.setupFastifyErrorHandler(fastify);
await fastify.register(envPlugin);

fastify.register(
  helmet,
  {
    contentSecurityPolicy: {
      directives: {
        "connect-src": ["'self'", "sdk.openui5.org"],
        "script-src": isLocalDev ? ["'self'", "'unsafe-inline'"] : ["'self'"],
        "frame-ancestors": [fastify.config.FRAME_ANCESTORS]
      },
    }
  }
)

fastify.register(proxy, {
  prefix: '/api',
});

await fastify.register(FastifyVite, {
  root: __dirname,
  dev: isLocalDev,
  spa: true,
});

fastify.get('/', function (req, reply) {
  return reply.html();
});

await fastify.vite.ready();
fastify.listen(
  {
    port: 5173,
    host: '0.0.0.0',
  },
  function (err, address) {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  },
);
