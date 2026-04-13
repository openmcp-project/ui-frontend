import fp from 'fastify-plugin';

// @ts-ignore
async function csrfProtection(fastify) {
  const { POST_LOGIN_REDIRECT, ALLOWED_CORS_ORIGINS } = fastify.config;

  const allowedOrigins = new Set<string>();

  if (POST_LOGIN_REDIRECT) {
    try {
      allowedOrigins.add(new URL(POST_LOGIN_REDIRECT).origin);
    } catch {
      fastify.log.warn('POST_LOGIN_REDIRECT is not a valid URL, skipping for CSRF allowlist');
    }
  }

  if (ALLOWED_CORS_ORIGINS && ALLOWED_CORS_ORIGINS.trim()) {
    for (const raw of ALLOWED_CORS_ORIGINS.split(',')) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      try {
        allowedOrigins.add(new URL(trimmed).origin);
      } catch {
        fastify.log.warn(`ALLOWED_CORS_ORIGINS entry "${trimmed}" is not a valid URL, skipping`);
      }
    }
  }

  if (allowedOrigins.size === 0) {
    throw new Error(
      'CSRF protection: allowedOrigins is empty — all POST requests would be blocked. ' +
        'Ensure POST_LOGIN_REDIRECT is a valid URL.',
    );
  }

  fastify.log.info({ allowedOrigins: [...allowedOrigins] }, 'CSRF origin validation enabled');

  // @ts-ignore
  fastify.addHook('onRequest', async (request, reply) => {
    if (request.method !== 'POST') return;

    const origin = request.headers['origin'];
    const referer = request.headers['referer'];

    let source: string | undefined;
    if (origin) {
      source = origin;
    } else if (referer) {
      try {
        source = new URL(referer).origin;
      } catch {
        // malformed referer
      }
    }

    if (!source || !allowedOrigins.has(source)) {
      request.log.warn({ origin, referer, source }, 'CSRF origin validation failed');
      return reply.code(403).send({ error: 'CSRF origin validation failed' });
    }
  });
}

export default fp(csrfProtection);
