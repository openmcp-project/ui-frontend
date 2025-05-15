import Fastify from 'fastify';
import FastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';
import proxy from './server/app.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
  logger: true,
});

fastify.register(proxy, {
  prefix: '/api',
});

fastify.register(FastifyStatic, {
  root: path.join(__dirname, 'dist'),
  // prefix: '/', // optional: default '/'
  // constraints: { host: 'example.com' } // optional: default {}
});

fastify.listen(
  {
    port: 5173,
  },
  function (err, address) {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  },
);
