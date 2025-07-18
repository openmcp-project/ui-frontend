import { sentryVitePlugin } from '@sentry/vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { viteFastify } from '@fastify/vite/plugin';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  root: resolve(import.meta.dirname),

  plugins: [
    viteFastify({ spa: true }),
    react(),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: 'ui-frontend',
      reactComponentAnnotation: {
        enabled: true,
      },
    }),
  ],

  build: {
    sourcemap: true,
  },
});
