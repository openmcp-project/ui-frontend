import { createRoot } from 'react-dom/client';
import { createApp } from './main.tsx';
import { initializeSentry } from './lib/sentry.ts';

// Initialize Sentry and get the Routes component (with or without Sentry integration)
const SentryRoutes = await initializeSentry();

export { SentryRoutes };

const root = createRoot(document.getElementById('root')!);
root.render(createApp());
