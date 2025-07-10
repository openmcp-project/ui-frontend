import fp from 'fastify-plugin';

function rootRoutes(fastify) {
  fastify.get('/', async (_request, reply) => {
    return reply.code(200).send({ status: 'ok', timestamp: new Date().toISOString() });
  });
}

export default fp(rootRoutes);
