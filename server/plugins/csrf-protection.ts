import fp from 'fastify-plugin';

const isLocalDev = process.argv.includes('--local-dev');

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

  if (!isLocalDev && allowedOrigins.size === 0) {
    throw new Error(
      'CSRF protection: allowedOrigins is empty — all POST requests would be blocked. ' +
        `Ensure POST_LOGIN_REDIRECT or ALLOWED_CORS_ORIGINS provides at least one valid URL. ` +
        `Received POST_LOGIN_REDIRECT=${JSON.stringify(POST_LOGIN_REDIRECT)}, ` +
        `ALLOWED_CORS_ORIGINS=${JSON.stringify(ALLOWED_CORS_ORIGINS)}.`,
    );
  }

  if (isLocalDev) {
    fastify.log.info('CSRF origin validation disabled in local development mode');
  } else {
    fastify.log.info({ allowedOrigins: [...allowedOrigins] }, 'CSRF origin validation enabled');
  }

  fastify.decorate('csrfPreHandler', csrfPreHandler.bind(null, allowedOrigins));
}

// @ts-ignore
function csrfPreHandler(allowedOrigins: Set<string>, request, reply, done) {
  if (isLocalDev) {
    return done();
  }

  const rawOrigin = request.headers['origin'];
  const rawReferer = request.headers['referer'];

  const origin = Array.isArray(rawOrigin) ? rawOrigin[0] : rawOrigin;
  const referer = Array.isArray(rawReferer) ? rawReferer[0] : rawReferer;

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

  done();
}

export default fp(csrfProtection);
