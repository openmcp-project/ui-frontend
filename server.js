import Fastify from 'fastify';
import FastifyVite from '@fastify/vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';
import proxy from './server/app.js';
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

const isDev = process.argv.includes('--dev');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendConfigLocation = isDev ? 'public/frontend-config.json' : 'dist/client/frontend-config.json';

if (process.env.FRONTEND_CONFIG_PATH !== undefined && process.env.FRONTEND_CONFIG_PATH.length > 0) {
  console.log('FRONTEND_CONFIG_PATH is specified. Will copy the frontend-config from there.');
  console.log(`  Copying ${process.env.FRONTEND_CONFIG_PATH} to ${frontendConfigLocation}`);
  copyFileSync(process.env.FRONTEND_CONFIG_PATH, frontendConfigLocation);
}

const fastify = Fastify({
  logger: true,
});

Sentry.setupFastifyErrorHandler(fastify);

fastify.register(proxy, {
  prefix: '/api',
});

await fastify.register(FastifyVite, {
  root: __dirname,
  dev: isDev,
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
