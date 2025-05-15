import Fastify from 'fastify';
import FastifyStatic from '@fastify/static';
import FastifyVite from '@fastify/vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';
import proxy from './server/app.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(__dirname);

const fastify = Fastify({
  logger: true,
});

fastify.register(proxy, {
  prefix: '/api',
});

// fastify.register(FastifyStatic, {
//   root: path.join(__dirname, 'dist'),
//   // prefix: '/', // optional: default '/'
//   // constraints: { host: 'example.com' } // optional: default {}
// });

await fastify.register(FastifyVite, {
  root: __dirname,
  dev: process.argv.includes('--dev'),
  spa: true,
});

fastify.get('/', (req, reply) => {
  return reply.html();
});

await fastify.vite.ready();
await fastify.listen(
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
