import fp from 'fastify-plugin';

// @ts-ignore
function healthRoutes(fastify) {
  // @ts-ignore
  fastify.get('/health', async (_request, reply) => {
    return reply.code(200).send({ status: 'ok' });
  });
}

export default fp(healthRoutes);
