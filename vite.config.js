import { sentryVitePlugin } from '@sentry/vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { viteFastify } from '@fastify/vite/plugin';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig({
  root: resolve(import.meta.dirname),

  plugins: [
    viteFastify({ spa: true }),
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/monaco-editor/min/vs',
          dest: 'assets',
        },
      ],
    }),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      telemetry: false,
      reactComponentAnnotation: {
        enabled: true,
      },
    }),
  ],

  build: {
    sourcemap: true,
    target: 'esnext', // Support top-level await
  },
});
