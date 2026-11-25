import * as Sentry from '@sentry/react';
import { createRoot } from 'react-dom/client';
import { initializeSentry } from './lib/telemetry/bootstrap/sentry.ts';
import { createApp } from './main.tsx';

// Start the GraphQL mock worker before anything renders, so the first queries are
// already intercepted. Dynamically imported and flag-gated → excluded from prod builds.
if (import.meta.env.VITE_MOCK_GRAPHQL === 'true') {
  const { startMockWorker } = await import('./mocks/browser.ts');
  await startMockWorker();
}

const { isSentryEnabled } = await initializeSentry();

const rootOptions = isSentryEnabled
  ? {
      onUncaughtError: Sentry.reactErrorHandler(),
      onCaughtError: Sentry.reactErrorHandler(),
      onRecoverableError: Sentry.reactErrorHandler(),
    }
  : {};

const root = createRoot(document.getElementById('root')!, rootOptions);
root.render(createApp());
