import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * Starts the Mock Service Worker for GraphQL. Only `/api/graphql` operations with
 * a handler are mocked; `onUnhandledRequest: 'bypass'` lets auth, the rest of the
 * REST API, and Vite assets reach the real backend untouched.
 *
 * Gated behind `VITE_MOCK_GRAPHQL` and dynamically imported from `mount.ts`, so
 * MSW never enters the production bundle.
 */
export async function startMockWorker(): Promise<void> {
  const worker = setupWorker(...handlers);
  await worker.start({ onUnhandledRequest: 'bypass' });
}
