// Initialize OpenTelemetry instrumentation FIRST
import './server/telemetry/bootstrap/opentelemetry-init.js';
import Fastify from 'fastify';
import FastifyVite from '@fastify/vite';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import proxy from './server/app.js';
import envPlugin from './server/config/env.js';
import { copyFileSync } from 'node:fs';
import { initSentry } from './server/telemetry/bootstrap/sentry.js';
import { injectDynatraceTag } from './server/telemetry/client-injection/dynatrace.js';
import { injectMatomoTag } from './server/telemetry/client-injection/matomo.js';
import serverTelemetryPlugin from './server/telemetry/telemetry.js';
const { DYNATRACE_SCRIPT_URL, MATOMO_URL, MATOMO_SITE_ID } = process.env;
if (DYNATRACE_SCRIPT_URL) {
  injectDynatraceTag(DYNATRACE_SCRIPT_URL);
}
let matomoScriptHash: string | null = null;
if (MATOMO_URL && MATOMO_SITE_ID) {
  matomoScriptHash = injectMatomoTag(MATOMO_URL, MATOMO_SITE_ID);
}

initSentry();

const isLocalDev = process.argv.includes('--local-dev');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Make frontend configuration available (frontend-config.json)
const frontendConfigLocation = isLocalDev ? 'public/frontend-config.json' : 'dist/client/frontend-config.json';
if (process.env.FRONTEND_CONFIG_PATH !== undefined && process.env.FRONTEND_CONFIG_PATH.length > 0) {
  console.log('FRONTEND_CONFIG_PATH is specified. Will copy the frontend-config from there.');
  console.log(`  Copying ${process.env.FRONTEND_CONFIG_PATH} to ${frontendConfigLocation}`);
  copyFileSync(process.env.FRONTEND_CONFIG_PATH, frontendConfigLocation);
}

// Make hyperspace portal configuration available (hyperspace-portal-config.json)
if (
  !isLocalDev &&
  process.env.HYPERSPACE_PORTAL_CONFIG_PATH !== undefined &&
  process.env.HYPERSPACE_PORTAL_CONFIG_PATH.length > 0
) {
  const hyperspacePortalConfigLocation = 'dist/client/hyperspace-portal-config.json';
  console.log('HYPERSPACE_PORTAL_CONFIG_PATH is specified. Will copy the hyperspace-portal-config from there.');
  console.log(`  Copying ${process.env.HYPERSPACE_PORTAL_CONFIG_PATH} to ${hyperspacePortalConfigLocation}`);
  copyFileSync(process.env.HYPERSPACE_PORTAL_CONFIG_PATH, hyperspacePortalConfigLocation);
}

const fastify = Fastify({
  logger: true,
  trustProxy: 1,
  connectionTimeout: 30_000,
  requestTimeout: 30_000,
});

await fastify.register(serverTelemetryPlugin);
await fastify.register(envPlugin);

fastify.register(cors, {
  origin: isLocalDev
    ? true // Allow all origins in local development
    : (origin, callback) => {
        // In production, validate against allowed origins
        const allowedOrigins =
          // @ts-ignore
          fastify.config.ALLOWED_CORS_ORIGINS && fastify.config.ALLOWED_CORS_ORIGINS.trim()
            ? // @ts-ignore
              fastify.config.ALLOWED_CORS_ORIGINS.split(',')
                // @ts-ignore
                .map((o) => o.trim())
                // @ts-ignore
                .filter((o) => o)
            : // @ts-ignore
              [fastify.config.POST_LOGIN_REDIRECT]; // Fallback to POST_LOGIN_REDIRECT

        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true, // Required for cookie-based sessions
});

let sentryHost = '';
// @ts-ignore
if (fastify.config.FRONTEND_SENTRY_DSN && fastify.config.FRONTEND_SENTRY_DSN.length > 0) {
  try {
    // @ts-ignore
    sentryHost = new URL(fastify.config.FRONTEND_SENTRY_DSN).hostname;
  } catch {
    console.log('FRONTEND_SENTRY_DSN is not a valid URL');
    sentryHost = '';
  }
}

let dynatraceOrigin = '';
if (DYNATRACE_SCRIPT_URL) {
  try {
    dynatraceOrigin = new URL(DYNATRACE_SCRIPT_URL).origin;
  } catch {
    console.error('DYNATRACE_SCRIPT_URL is not a valid URL');
  }
}

let matomoOrigin = '';
if (MATOMO_URL) {
  try {
    matomoOrigin = new URL(MATOMO_URL).origin;
  } catch {
    console.error('MATOMO_URL is not a valid URL');
  }
}

fastify.register(helmet, {
  // CSP is managed manually below so we can suppress it for /api/headlamp/* paths.
  // Headlamp's inline bootstrap scripts are blocked by script-src 'self', and the header
  // must simply be absent for those responses — Helmet does not support per-request directives.
  contentSecurityPolicy: false,
  // frame-ancestors in the manual CSP below handles framing policy; this would add a
  // conflicting X-Frame-Options: SAMEORIGIN header that overrides it and breaks portal embedding.
  xFrameOptions: false,
  // Needed for https enforcement
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// Strip BFF CSP for Headlamp proxy responses — Helmet's script-src 'self' blocks inline scripts.
// Headlamp's own CSP is already removed by rewriteHeaders in http-proxy.ts.
fastify.addHook('onSend', async (req, reply, payload) => {
  const pathname = req.url.split('?')[0];
  if (pathname === '/api/headlamp' || pathname.startsWith('/api/headlamp/')) {
    return payload;
  }
  // FRAME_ANCESTORS is a comma-separated env list; CSP separates sources by whitespace,
  // so a raw comma turns every entry after the first into one invalid token the browser drops.
  const frameAncestors = ((fastify as any).config?.FRAME_ANCESTORS ?? '')
    .split(',')
    .map((origin: string) => origin.trim())
    .filter(Boolean)
    .join(' ');
  const telemetryOrigins = [sentryHost, dynatraceOrigin, matomoOrigin].filter(Boolean).join(' ');
  // The Matomo bootstrap is an inline <script>; a strict script-src blocks it unless
  // its exact sha256 is whitelisted. Scoped to script-src only (a script hash is
  // meaningless in connect-src/img-src, which also consume telemetryOrigins).
  const scriptSrcSources = [telemetryOrigins, matomoScriptHash ? `'${matomoScriptHash}'` : '']
    .filter(Boolean)
    .join(' ');
  const csp = [
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data:${matomoOrigin ? ` ${matomoOrigin}` : ''}`,
    `connect-src 'self' sdk.openui5.org api.iconify.design api.simplesvg.com api.unisvg.com ${telemetryOrigins}`,
    isLocalDev
      ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${telemetryOrigins}`
      : `script-src 'self' ${scriptSrcSources}`,
    "frame-src 'self'",
    `frame-ancestors 'self'${frameAncestors ? ` ${frameAncestors}` : ''}`,
    "base-uri 'self'",
    "font-src 'self' https: data:",
    "form-action 'self'",
    "object-src 'none'",
    "script-src-attr 'none'",
    'upgrade-insecure-requests',
  ]
    .filter(Boolean)
    .join(';');
  reply.header('content-security-policy', csp);
  return payload;
});

fastify.register(proxy, {
  prefix: '/api',
});

await fastify.register(FastifyVite, {
  root: __dirname,
  dev: isLocalDev,
  spa: true,
  // Vite content-hashes all assets in /assets/ — safe to cache indefinitely
  fastifyStaticOptions: isLocalDev ? undefined : {
    maxAge: '1y',
    immutable: true,
  },
});

fastify.get('/sentry', function (req, reply) {
  return reply.send({
    // @ts-ignore
    FRONTEND_SENTRY_DSN: fastify.config.FRONTEND_SENTRY_DSN,
    // @ts-ignore
    FRONTEND_SENTRY_ENVIRONMENT: fastify.config.FRONTEND_SENTRY_ENVIRONMENT,
  });
});

// @ts-ignore
fastify.get('/', function (req, reply) {
  return reply.html();
});

await fastify.vite.ready();
fastify.listen(
  {
    port: 5173,
    host: '0.0.0.0',
  },
  // @ts-ignore
  function (err, address) {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  },
);
