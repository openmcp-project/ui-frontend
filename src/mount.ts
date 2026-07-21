import * as Sentry from '@sentry/react';
import { createRoot } from 'react-dom/client';
import { initializeSentry } from './lib/telemetry/bootstrap/sentry.ts';
import { createApp } from './main.tsx';

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
