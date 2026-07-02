import { defineConfig } from 'cypress';

import { defineConfig as defineViteConfig } from 'vite';

import react from '@vitejs/plugin-react';

const viteConfig = defineViteConfig({
  plugins: [react()],
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  resolve: {
    alias: {
      path: 'path-browserify',
    },
  },
  optimizeDeps: {
    include: ['path-browserify'],
    rolldownOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
});

export default defineConfig({
  includeShadowDom: true,
  viewportWidth: 1920,
  viewportHeight: 1080,
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    configFile: 'cypress-reporters.json',
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
      viteConfig: viteConfig,
    },
    specPattern: '**/*.cy.{js,ts,jsx,tsx}',
  },
});
