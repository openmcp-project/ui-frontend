import { defineConfig } from 'cypress';

import { defineConfig as defineViteConfig } from 'vite';

import react from '@vitejs/plugin-react';

import { monacoWorkerAlias, monacoOptimizeDepsExclude } from './vite.monaco.js';

const viteConfig = defineViteConfig({
  plugins: [react()],
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  resolve: {
    alias: [{ find: 'path', replacement: 'path-browserify' }, monacoWorkerAlias],
  },
  optimizeDeps: {
    include: ['path-browserify'],
    exclude: monacoOptimizeDepsExclude,
    rolldownOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
});

export default defineConfig({
  includeShadowDom: true,
  retries: { runMode: 2, openMode: 0 },
  viewportWidth: 1920,
  viewportHeight: 1080,
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
      viteConfig: viteConfig,
    },
    specPattern: '**/*.cy.{js,ts,jsx,tsx}',
  },
});
