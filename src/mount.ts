import { createRoot } from 'react-dom/client';
import { createApp } from './main.tsx';
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
});

const root = createRoot(document.getElementById('root')!);
root.render(createApp());
