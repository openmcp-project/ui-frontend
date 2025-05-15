import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import viteFastify from '@fastify/vite/plugin';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  root: resolve(import.meta.dirname),
  plugins: [viteFastify({ spa: true }), react()],
});
