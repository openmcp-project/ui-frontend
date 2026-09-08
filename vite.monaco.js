import { resolve } from 'node:path';

// Shared Monaco worker bundling config, used by vite.config.js and cypress.config.ts.

// Monaco 0.56's exports map ("./*": "./esm/vs/*.js") no longer resolves the bare editor.worker
// deep-import that monaco-worker-manager and our ?worker import rely on; map it to the real file.
export const monacoWorkerAlias = {
  find: /^monaco-editor\/esm\/vs\/editor\/editor\.worker(\.js)?(\?worker)?$/,
  replacement: resolve(import.meta.dirname, 'node_modules/monaco-editor/esm/vs/editor/editor.worker.js') + '$2',
};

// Pre-bundling a ?worker import mangles its default export (dev-only), so keep these out of it.
export const monacoOptimizeDepsExclude = ['monaco-editor', 'monaco-yaml'];
