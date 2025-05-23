import {defineConfig} from "cypress";

import {defineConfig as defineViteConfig} from 'vite';

import react from '@vitejs/plugin-react';

const viteConfig = defineViteConfig({
  plugins: [
    react(),
  ],
});
export default defineConfig({
  includeShadowDom: true,
  viewportWidth: 1920,
  viewportHeight: 1080,
  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
      viteConfig: viteConfig,
    },
    specPattern: "**/*.test.{js,ts,jsx,tsx}",
  },

  e2e: {
    baseUrl: "http://localhost:5173/",
    setupNodeEvents() {
      // implement node event listeners here
    },
  },
});
