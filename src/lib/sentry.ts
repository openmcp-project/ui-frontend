import * as Sentry from '@sentry/react';
import React from 'react';
import { Routes, useLocation, useNavigationType, createRoutesFromChildren, matchRoutes } from 'react-router-dom';

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
export async function initializeSentry(): Promise<typeof Routes> {
  const sentryConfig = await fetchSentryConfig();

  if (!isValidSentryConfig(sentryConfig)) {
    console.warn('Invalid or missing Sentry configuration, continuing without Sentry integration');
    return Routes;
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
  });

  return Sentry.withSentryReactRouterV7Routing(Routes);
}
