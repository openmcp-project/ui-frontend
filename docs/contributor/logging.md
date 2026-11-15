# Server Logging Guide

## The rule

Use `request.log` inside a request handler, `logger.child({ component: '…' })` elsewhere. Never use `console.log`, `console.error`, etc. — ESLint's `no-console` rule enforces this in `src/` and the code review convention enforces it in `server/`.

## Level contract

| Level | Meaning | Examples |
|---|---|---|
| `error` | Someone has to act. | 5xx, unhandled error, upstream unreachable |
| `warn` | Handled, but not expected. | token refresh failed, rate limit hit, slow request |
| `info` | An outcome worth knowing in production. | server started, login succeeded, API request finished |
| `debug` | How we got there. | step narration, asset and probe requests, session created |

**Rule of thumb for reviewers:** an `info` line must describe a result, never a step ("Preparing…", "Extracting…").

## Importing the logger

```ts
// In a Fastify request handler — use the request-scoped logger
fastify.get('/api/example', async (req, reply) => {
  req.log.info({ event: 'example.done' }, 'Example completed');
});

// Outside a request (bootstrap, background work)
import { logger } from '../logger.js';
const log = logger.child({ component: 'my-module' });
log.info('Module initialized');
```

## Structured fields

Always pass structured data as the first argument (merging object) and the human-readable message as the second:

```ts
// ✅ Good
req.log.info({ event: 'auth.login.succeeded', flow: 'onboarding' }, 'Login succeeded');

// ❌ Bad — string interpolation loses structure
req.log.info(`Login succeeded for flow ${flow}`);

// ❌ Bad — third argument is silently dropped by pino
req.log.error({ plugin: 'x' }, 'Failed', error);

// ✅ Good — error goes in the merging object as `err`
req.log.error({ plugin: 'x', err: error }, 'Failed');
```

## Event naming

Give every application log a stable `event` field so operators can query and alert on it:

```ts
req.log.info({ event: 'auth.login.succeeded' }, 'Login succeeded');
```

Use dot-separated names: `<domain>.<noun>.<past-tense-verb>`.

## Redaction

The central logger automatically redacts sensitive fields. If you're logging an object that contains secrets not covered by the existing paths, add a new path to `server/logger.ts` `redact.paths`.

## Client-side console

The `ConsoleAdapter` in `src/lib/telemetry/adapters/` is the only place in client code where `console.*` is permitted (along with `TelemetryService.ts` and `src/lib/telemetry/bootstrap/`). The ESLint `no-console` rule blocks it everywhere else.
