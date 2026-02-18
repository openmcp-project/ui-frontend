import * as Sentry from '@sentry/react';
import { createRoot } from 'react-dom/client';
import { initializeSentry } from './lib/sentry.ts';
import { createApp } from './main.tsx';

const { SentryRoutes, isSentryEnabled } = await initializeSentry();

export { SentryRoutes };

const rootOptions = isSentryEnabled
  ? {
      onUncaughtError: Sentry.reactErrorHandler(),
      onCaughtError: Sentry.reactErrorHandler(),
      onRecoverableError: Sentry.reactErrorHandler(),
    }
  : {};

const root = createRoot(document.getElementById('root')!, rootOptions);
root.render(createApp());
