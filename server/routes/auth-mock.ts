import fp from 'fastify-plugin';

const MOCK_USER = {
  sub: 'mock-user-sub-123',
  email: 'mock@example.com',
};

// @ts-ignore
async function mockAuthPlugin(fastify) {
  if (fastify.config.MOCK_AUTH !== 'true') return;

  const authRateLimit = {
    rateLimit: { max: 100, timeWindow: '1 minute' },
  };

  // @ts-expect-error - Fastify plugin route handler typing needs refinement
  fastify.get('/auth/onboarding/me', { config: authRateLimit }, async (_req, reply) => {
    return reply.send({ isAuthenticated: true, user: MOCK_USER, tokenExpiresAt: null });
  });

  // @ts-expect-error - Fastify plugin route handler typing needs refinement
  fastify.post('/auth/onboarding/refresh', { config: authRateLimit }, async (_req, reply) => {
    return reply.send({ success: true });
  });

  // @ts-expect-error - Fastify plugin route handler typing needs refinement
  fastify.get('/auth/mcp/me', { config: authRateLimit }, async (_req, reply) => {
    return reply.send({ isAuthenticated: true, tokenExpiresAt: null });
  });

  // @ts-expect-error - Fastify plugin route handler typing needs refinement
  fastify.post('/auth/mcp/refresh', { config: authRateLimit }, async (_req, reply) => {
    return reply.send({ success: true });
  });

  // @ts-expect-error - Fastify plugin route handler typing needs refinement
  fastify.post('/auth/logout', { config: authRateLimit }, async (_req, reply) => {
    return reply.send({ message: 'Logged out' });
  });

  // Login endpoints: in mock mode redirect straight back to the app.
  // These are normally never reached because /auth/onboarding/me and /auth/mcp/me
  // already return isAuthenticated: true, so the app never triggers a login redirect.
  // @ts-expect-error - Fastify plugin route handler typing needs refinement
  fastify.get('/auth/onboarding/login', { config: authRateLimit }, async (_req, reply) => {
    return reply.redirect(fastify.config.POST_LOGIN_REDIRECT || '/');
  });

  // @ts-expect-error - Fastify plugin route handler typing needs refinement
  fastify.get('/auth/mcp/login', { config: authRateLimit }, async (_req, reply) => {
    return reply.redirect(fastify.config.POST_LOGIN_REDIRECT || '/');
  });
}

export default fp(mockAuthPlugin);
