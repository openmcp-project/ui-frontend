import { createRoot } from 'react-dom/client';
import { createApp } from './main.tsx';
import * as Sentry from '@sentry/react';
import React from 'react';
import { Routes, useLocation, useNavigationType, createRoutesFromChildren, matchRoutes } from 'react-router-dom';

let sentryRoutes = Routes;
if (import.meta.env.VITE_SENTRY_DSN && import.meta.env.VITE_SENTRY_DSN.length > 0) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT,
    integrations: [
      Sentry.reactRouterV7BrowserTracingIntegration({
        useEffect: React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
    ],
  });

  sentryRoutes = Sentry.withSentryReactRouterV7Routing(Routes);
}

export const SentryRoutes = sentryRoutes;

const root = createRoot(document.getElementById('root')!);
root.render(createApp());
