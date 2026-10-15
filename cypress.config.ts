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
    include: ['path-browserify', '@sentry/react'],
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
  retries: { runMode: 3, openMode: 0 },
  video: false,
  defaultCommandTimeout: 8000,
  experimentalMemoryManagement: true,
  numTestsKeptInMemory: 0,
  viewportWidth: 1920,
  viewportHeight: 1080,
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
      viteConfig: viteConfig,
    },
    specPattern: '**/*.cy.{js,ts,jsx,tsx}',
    setupNodeEvents(on) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'chromium') {
          // Required for stable Chrome in Linux CI containers (GitHub Actions).
          // Default /dev/shm is 64 MB — Chrome crashes without this flag.
          launchOptions.args.push('--disable-dev-shm-usage');
          launchOptions.args.push('--no-sandbox');
          // Prevent Chrome from throttling timers and background work — these
          // cause test timing to become non-deterministic on a loaded CI runner.
          launchOptions.args.push('--disable-gpu');
          launchOptions.args.push('--disable-extensions');
          launchOptions.args.push('--disable-background-timer-throttling');
          launchOptions.args.push('--disable-backgrounding-occluded-windows');
          launchOptions.args.push('--disable-renderer-backgrounding');
          return launchOptions;
        }
      });
    },
  },
});
