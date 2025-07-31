import fp from 'fastify-plugin';
import sensible from '@fastify/sensible';

// @ts-ignore
function sensiblePlugin(fastify) {
  fastify.register(sensible, { errorHandler: false });
}

export default fp(sensiblePlugin);
