import * as Sentry from '@sentry/react';
import React from 'react';
import { createRoutesFromChildren, matchRoutes, Routes, useLocation, useNavigationType } from 'react-router-dom';

// Define proper typing for Sentry configuration
interface SentryConfig {
  FRONTEND_SENTRY_DSN: string;
  FRONTEND_SENTRY_ENVIRONMENT: string;
}

// Validate sentryConfig format
function isValidSentryConfig(config: unknown): config is SentryConfig {
  if (typeof config !== 'object' || config === null) {
    return false;
  }

  const typedConfig = config as Record<string, unknown>;
  return (
    typeof typedConfig.FRONTEND_SENTRY_DSN === 'string' &&
    typedConfig.FRONTEND_SENTRY_DSN.length > 0 &&
    typeof typedConfig.FRONTEND_SENTRY_ENVIRONMENT === 'string' &&
    typedConfig.FRONTEND_SENTRY_ENVIRONMENT.length > 0
  );
}

// Fetch Sentry configuration from server
async function fetchSentryConfig(): Promise<unknown> {
  try {
    const response = await fetch('/sentry');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn('Failed to fetch Sentry configuration:', error);
    return null;
  }
}

// Initialize Sentry and return the wrapped Routes component
export async function initializeSentry(): Promise<{
  SentryRoutes: typeof Routes;
  isSentryEnabled: boolean;
}> {
  const sentryConfig = await fetchSentryConfig();

  if (!isValidSentryConfig(sentryConfig)) {
    console.warn('Invalid or missing Sentry configuration, continuing without Sentry integration');
    return { SentryRoutes: Routes, isSentryEnabled: false };
  }

  // Initialize Sentry with valid configuration
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

    // Filter out noisy errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      /^Non-Error.*captured$/,
    ],

    // Filter sensitive data before sending
    beforeSend(event, _hint) {
      // Remove sensitive query params
      if (event.request?.url) {
        try {
          const url = new URL(event.request.url);
          if (url.searchParams.has('token') || url.searchParams.has('apiKey')) {
            url.searchParams.delete('token');
            url.searchParams.delete('apiKey');
            event.request.url = url.toString();
          }
        } catch (e) {
          console.log(e);
        }
      }
      return event;
    },
  });

  return {
    SentryRoutes: Sentry.withSentryReactRouterV7Routing(Routes),
    isSentryEnabled: true,
  };
}
