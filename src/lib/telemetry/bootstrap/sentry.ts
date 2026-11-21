import * as Sentry from '@sentry/react';
import React from 'react';
import { createRoutesFromChildren, matchRoutes, useLocation, useNavigationType } from 'react-router-dom';

interface SentryConfig {
  FRONTEND_SENTRY_DSN: string;
  FRONTEND_SENTRY_ENVIRONMENT: string;
}

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

// Params fed to the SDK's `urlQueryParams.deny` list. `code`/`state` are OIDC
// authorization-flow params (the code is exchangeable for tokens); `token`/
// `apiKey` are generic secrets.
const SENSITIVE_QUERY_PARAMS = ['code', 'state', 'token', 'apiKey'];

// Substring terms for the manual scrubbers. The SDK's `urlQueryParams` filter
// does not reach the `#` fragment (where HashRouter keeps its query) or client
// breadcrumb URLs, so the scrubbers match by substring: `token` also catches
// `id_token`/`access_token`/`authToken`, `state` catches `session_state`.
const SENSITIVE_QUERY_PARAM_SNIPPETS = ['code', 'state', 'token', 'key', 'auth'];

function isSensitiveQueryParam(param: string): boolean {
  const lower = param.toLowerCase();
  return SENSITIVE_QUERY_PARAM_SNIPPETS.some((snippet) => lower.includes(snippet));
}

function removeSensitiveQueryParams(params: URLSearchParams): boolean {
  let changed = false;
  for (const param of [...params.keys()]) {
    if (isSensitiveQueryParam(param)) {
      params.delete(param);
      changed = true;
    }
  }
  return changed;
}

function stripSensitiveParamsFromUrlPart(urlPart: string): { value: string; changed: boolean } {
  const queryStart = urlPart.indexOf('?');
  if (queryStart === -1) {
    return { value: urlPart, changed: false };
  }

  const params = new URLSearchParams(urlPart.slice(queryStart + 1));
  if (!removeSensitiveQueryParams(params)) {
    return { value: urlPart, changed: false };
  }

  const query = params.toString();
  return { value: `${urlPart.slice(0, queryStart)}${query ? `?${query}` : ''}`, changed: true };
}

// Strip sensitive params from a URL string. Returns the input unchanged when it
// carries none of the params. HashRouter routes have their own query string
// after `#`, so sanitize the URL and fragment independently.
function stripSensitiveParams(urlString: string): string {
  const fragmentStart = urlString.indexOf('#');
  const urlPart = fragmentStart === -1 ? urlString : urlString.slice(0, fragmentStart);
  const fragmentPart = fragmentStart === -1 ? undefined : urlString.slice(fragmentStart + 1);
  const sanitizedUrl = stripSensitiveParamsFromUrlPart(urlPart);
  const sanitizedFragment = fragmentPart === undefined ? undefined : stripSensitiveParamsFromUrlPart(fragmentPart);

  if (!sanitizedUrl.changed && !sanitizedFragment?.changed) {
    return urlString;
  }

  return `${sanitizedUrl.value}${sanitizedFragment === undefined ? '' : `#${sanitizedFragment.value}`}`;
}

function stripSensitiveQueryString(queryString: string): string {
  const params = new URLSearchParams(queryString);
  if (!removeSensitiveQueryParams(params)) {
    return queryString;
  }
  return params.toString();
}

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

export async function initializeSentry(): Promise<{ isSentryEnabled: boolean }> {
  const sentryConfig = await fetchSentryConfig();

  if (!isValidSentryConfig(sentryConfig)) {
    console.warn('Invalid or missing Sentry configuration, continuing without Sentry integration');
    return { isSentryEnabled: false };
  }

  // NOTE: errors thrown between module load and this point are dropped — Sentry
  // is not initialized until the `/sentry` fetch above resolves, and there is no
  // pre-init queue. A slow `/sentry` also delays all capture for its duration.
  Sentry.init({
    dsn: sentryConfig.FRONTEND_SENTRY_DSN,
    environment: sentryConfig.FRONTEND_SENTRY_ENVIRONMENT,
    dataCollection: {
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: { deny: SENSITIVE_QUERY_PARAMS },
      graphQL: { document: false, variables: false },
      genAI: { inputs: false, outputs: false },
      databaseQueryData: false,
      queues: false,
      stackFrameVariables: false,
      frameContextLines: 0,
    },

    integrations: [
      Sentry.reactRouterV7BrowserTracingIntegration({
        useEffect: React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
    ],

    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      /^Non-Error.*captured$/,
    ],

    // These scrubbers are the only CLIENT-side gate — they run before the event
    // leaves the browser, which Sentry's server-side scrubbing cannot do. They
    // also cover what `urlQueryParams` misses: the `#` fragment and breadcrumb
    // URLs. Only `event.request.*` is scrubbed; secrets interpolated into an
    // Error message or passed as `captureException` extra reach Sentry unredacted.
    beforeSend(event, _hint) {
      if (event.request) {
        delete event.request.data;
        if (event.request.headers) {
          event.request.headers = Object.keys(event.request.headers).reduce<Record<string, string>>((acc, key) => {
            acc[key] = '';
            return acc;
          }, {});
        }
        if (event.request.url) {
          event.request.url = stripSensitiveParams(event.request.url);
        }
        if (typeof event.request.query_string === 'string') {
          event.request.query_string = stripSensitiveQueryString(event.request.query_string);
        }
      }
      return event;
    },
    beforeBreadcrumb(breadcrumb) {
      const data = breadcrumb.data;
      if (data) {
        (['url', 'from', 'to'] as const).forEach((key) => {
          if (typeof data[key] === 'string') {
            data[key] = stripSensitiveParams(data[key]);
          }
        });
      }
      return breadcrumb;
    },
  });

  return { isSentryEnabled: true };
}
