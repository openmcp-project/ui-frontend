import * as Sentry from '@sentry/node';
import { ApplicationError } from '../../errors.js';

// Params fed to the SDK's `urlQueryParams.deny` list.
const SENSITIVE_QUERY_PARAMS = ['code', 'state', 'token', 'apiKey'];

// Substring terms for the manual scrubbers. Match by substring so `token` also
// catches `id_token`/`access_token`/`authToken` and `state` catches
// `session_state`, which the exact-match `urlQueryParams` deny-list would miss.
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

function stripSensitiveParams(urlString: string): string {
  try {
    const url = new URL(urlString);
    return removeSensitiveQueryParams(url.searchParams) ? url.toString() : urlString;
  } catch (e) {
    console.error(e);
    return urlString;
  }
}

function stripSensitiveQueryString(queryString: string): string {
  const params = new URLSearchParams(queryString);
  if (!removeSensitiveQueryParams(params)) {
    return queryString;
  }
  return params.toString();
}

export function initSentry(): void {
  if (!process.env.BFF_SENTRY_DSN || process.env.BFF_SENTRY_DSN.trim() === '') {
    console.error('Error: Sentry DSN is not provided. Sentry will not be initialized.');
    return;
  }

  Sentry.init({
    dsn: process.env.BFF_SENTRY_DSN,
    environment: process.env.FRONTEND_SENTRY_ENVIRONMENT,
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
    integrations(defaultIntegrations) {
      return [
        ...defaultIntegrations.filter((integration) => integration.name !== 'Fastify'),
        Sentry.fastifyIntegration({
          shouldHandleError(error, _request, reply) {
            if (error instanceof ApplicationError) {
              // Application errors are handled explicitly by the HTTP error
              // boundary so their safe context can be included exactly once.
              return false;
            }
            return reply.statusCode >= 500 || reply.statusCode <= 299;
          },
        }),
      ];
    },
    beforeSend(event) {
      if (event.request) {
        // Scrub values added manually or by integrations that populated the scope
        // before the dataCollection policy applied. Only `event.request.*` is
        // scrubbed; secrets in an Error message or `captureException` extra reach
        // Sentry unredacted.
        delete event.request.data;
        if (event.request.headers) {
          event.request.headers = Object.keys(event.request.headers).reduce<Record<string, string>>((acc, key) => {
            acc[key] = '';
            return acc;
          }, {});
        }
        if (event.request.cookies) {
          event.request.cookies = Object.keys(event.request.cookies).reduce<Record<string, string>>((acc, key) => {
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
  });
}
