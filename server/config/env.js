import fastifyPlugin from 'fastify-plugin';
import fastifyEnv from '@fastify/env';

const schema = {
  type: 'object',
  required: [
    'OIDC_ISSUER',
    'OIDC_CLIENT_ID',
    'OIDC_CLIENT_ID_MCP',
    'OIDC_REDIRECT_URI',
    'OIDC_SCOPES',
    'POST_LOGIN_REDIRECT',
    'COOKIE_SECRET',
    'SESSION_SECRET',
    'API_BACKEND_URL',
    'FRAME_ANCESTORS',
  ],
  properties: {
    // Application variables (.env)
    OIDC_ISSUER: { type: 'string' },
    OIDC_CLIENT_ID: { type: 'string' },
    OIDC_CLIENT_ID_MCP: { type: 'string' },
    OIDC_REDIRECT_URI: { type: 'string' },
    OIDC_SCOPES: { type: 'string' },
    POST_LOGIN_REDIRECT: { type: 'string' },
    COOKIE_SECRET: { type: 'string' },
    SESSION_SECRET: { type: 'string' },
    API_BACKEND_URL: { type: 'string' },
    FEEDBACK_SLACK_URL: { type: 'string' },
    FEEDBACK_URL_LINK: { type: 'string' },
    FRAME_ANCESTORS: { type: 'string' },
    BFF_SENTRY_DSN: { type: 'string' },
    VITE_SENTRY_DSN: { type: 'string' },
    VITE_SENTRY_ENVIRONMENT: { type: 'string' },

    // System variables
    NODE_ENV: { type: 'string', enum: ['development', 'production'] },
  },
};

async function envPlugin(fastify) {
  await fastify.register(fastifyEnv, { schema });
}

export default fastifyPlugin(envPlugin);
