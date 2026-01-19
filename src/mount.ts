import { createRoot } from 'react-dom/client';
import { createApp } from './main.tsx';
import { initializeSentry } from './lib/sentry.ts';
import { initializeDynatrace } from './utils/analytics.ts';

// Initialize Sentry and get the Routes component (with or without Sentry integration)
const SentryRoutes = await initializeSentry();

initializeDynatrace();

export { SentryRoutes };

const root = createRoot(document.getElementById('root')!);
root.render(createApp());
