import * as Sentry from '@sentry/react';
import { createRoot, ErrorInfo } from 'react-dom/client';
import { initializeSentry } from './lib/sentry.ts';
import { createApp } from './main.tsx';

const { SentryRoutes, isSentryEnabled } = await initializeSentry();

export { SentryRoutes };

const rootOptions = isSentryEnabled
  ? {
      onUncaughtError: (error: unknown, errorInfo: ErrorInfo) => {
        Sentry.captureException(error, {
          level: 'error',
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
              errorBoundary: false,
            },
          },
        });
      },

      onCaughtError: (error: unknown, errorInfo: ErrorInfo) => {
        Sentry.captureException(error, {
          level: 'warning',
          fingerprint: ['caught-by-boundary', '{{ default }}'],
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
              errorBoundary: true,
            },
          },
        });
      },

      onRecoverableError: (error: unknown, errorInfo: ErrorInfo) => {
        Sentry.captureException(error, {
          level: 'info',
          fingerprint: ['recoverable-error'],
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
              recoverable: true,
            },
          },
        });
      },
    }
  : {};

const root = createRoot(document.getElementById('root')!, rootOptions);
root.render(createApp());
