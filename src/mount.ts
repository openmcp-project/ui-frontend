import { createRoot } from 'react-dom/client';
import { createApp } from './main.tsx';
import * as Sentry from '@sentry/react';
import React from 'react';
import { Routes, useLocation, useNavigationType, createRoutesFromChildren, matchRoutes } from 'react-router-dom';

let sentryRoutes = Routes;

const sentryConfig = await fetch('/sentry').then((res) => res.json());

if (
  sentryConfig.FRONTEND_SENTRY_DSN &&
  sentryConfig.FRONTEND_SENTRY_DSN.length > 0 &&
  sentryConfig.FRONTEND_SENTRY_ENVIRONMENT &&
  sentryConfig.FRONTEND_SENTRY_ENVIRONMENT.length > 0
) {
  Sentry.init({
    dsn: sentryConfig.FRONTEND_SENTRY_DSN,
    environment: sentryConfig.FRONTEND_SENTRY_ENVIRONMENT,
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
