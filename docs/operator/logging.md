# Server Logging

The BFF uses [pino](https://getpino.io) as its single logger. Every Fastify request, every bootstrap module, and every server-side telemetry adapter log through the same instance (`server/logger.ts`).

## Environment variables

| Variable | Values | Default | Description |
|---|---|---|---|
| `LOG_LEVEL` | `trace`, `debug`, `info`, `warn`, `error` | `info` | Minimum level emitted. |
| `LOG_FORMAT` | `json`, `pretty` | `pretty` in local dev, `json` otherwise | `pretty` uses `pino-pretty` (devDependency); falls back to `json` with a warning if not installed. |
| `OTEL_LOG_LEVEL` | `none`, `error`, `warn`, `info`, `debug`, `verbose`, `all` | `warn` | OpenTelemetry diagnostics level (maps to `DiagLogLevel`). |

## Line format

In production (`LOG_FORMAT=json`), every line is a JSON object with at least:

```json
{"level":30,"time":1700000000000,"msg":"GET /api/projects 200 12ms","reqId":"abc-123","event":"http.request","class":"api","method":"GET","route":"/api/projects","path":"/api/projects","status":200,"durationMs":12}
```

In local dev (`LOG_FORMAT=pretty`):

```
10:30:15 INFO: GET /api/projects 200 12ms
```

## Request correlation

Every response includes an `x-request-id` header. If the client sends a well-formed `x-request-id` (word characters and hyphens, max 128 chars), the server adopts it; otherwise a UUID is generated. The same id appears in logs as `reqId`.

When OpenTelemetry tracing is active, `trace_id` and `span_id` are added to every log line automatically.

## Event reference

### Access log (`http.request`)

One line per HTTP request, emitted in an `onResponse` hook.

| Field | Description |
|---|---|
| `event` | Always `http.request` |
| `class` | `api`, `probe`, `headlamp`, or `asset` |
| `method` | HTTP method |
| `route` | Fastify route pattern (e.g. `/api/projects`) |
| `path` | Actual request path (query string stripped) |
| `status` | HTTP status code |
| `durationMs` | Response time in milliseconds |

**Level rules:**

| Condition | Level |
|---|---|
| status ≥ 500 | `error` |
| status = 429 or duration > 3000ms | `warn` |
| class = `api` | `info` |
| class = `probe`, `headlamp`, or `asset` | `debug` |

### Auth events

| Event | Level | When |
|---|---|---|
| `auth.login.started` | `debug` | OIDC redirect prepared, callback handling begun |
| `auth.login.succeeded` | `info` | User info extracted, tokens stored |
| `auth.login.failed` | `warn` | Authentication error (via error handler) |
| `auth.refresh.succeeded` | `debug` | Token refresh completed |
| `auth.refresh.failed` | `warn` | Token refresh error |
| `session.created` | `debug` | New encryption key or empty store created |

## Redacted fields

The logger redacts sensitive fields with `[redacted]`:

- `req.headers.authorization`
- `req.headers.cookie`
- `*.kubeconfig`
- `*.accessToken`, `*.refreshToken`, `*.token`

Query strings are never logged (stripped from URL paths).

## Example queries

**All log lines for one request:**

```sh
cat logs.json | jq 'select(.reqId == "abc-123")'
```

**Login failures per hour:**

```sh
cat logs.json | jq 'select(.event == "auth.login.failed")' | ...
```

**Slow requests (>3s):**

```sh
cat logs.json | jq 'select(.event == "http.request" and .durationMs > 3000)'
```
