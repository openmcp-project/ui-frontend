# Contributor Guide

Welcome! Before contributing, please read [`CONTRIBUTING.md`](../../CONTRIBUTING.md) — DCO sign-off is required and contributions need a linked issue first.

## Contents

- [Running Locally](#running-locally)
- [Building](#building)
- [Testing](testing.md) — unit, component, smoke tests and when to use each
- [New Components](new-component.md) — design, build, and test patterns
- [New API Requests](new-api-request.md) — SWR, Apollo, and BFF proxy patterns
- [Telemetry](telemetry.md) — how to add tracked events to a new feature
- [Static Analysis](static-analysis.md) — ESLint, TypeScript, Prettier, npmPkgJsonLint
- [Licensing & Legal](licensing.md) — REUSE, Apache-2.0, DCO, Code of Conduct

---

## Running Locally

### Prerequisites

- Node `^24.0.0`, npm `^11.0.0`

### Setup

```bash
npm i
cp frontend-config.json public/frontend-config.json   # edit backendUrl
cp .env.template .env                                  # fill OIDC values and secrets
npm run dev                                            # http://localhost:5173
```

> **Safari on localhost** — cookies and CSP behave differently. See the [Safari Support](../../README.md#safari-support) section in the README for the manual workaround. Do not commit those edits.

### Headlamp (local dev cluster)

The UI embeds [Headlamp](https://headlamp.dev) for visualising Kubernetes resources inside a ControlPlane. For local development a [kind](https://kind.sigs.k8s.io) cluster is used.

**Prerequisites:** `kind`, `kubectl`, `helm`, `task` ([Taskfile](https://taskfile.dev))

```bash
# One-time: creates kind cluster, installs Headlamp, port-forwards to http://localhost:8090
task headlamp:dev
```

Then set `HEADLAMP_UPSTREAM_URL=http://localhost:8090` in `.env` and run `npm run dev`.

To hot-sync locally built Headlamp plugins (no restart needed):

```bash
task headlamp:update
```

---

## Building

### Client + Server (production)

```bash
npm run build          # tsc (server) + vite (client) → dist/
npm run start          # node dist/server.js
```

### Client preview only

```bash
npm run preview        # vite preview on dist/client/
```

### Docker image

```bash
task build:image:local TAG=my-tag
# or
docker build -t ghcr.io/openmcp-project/mcp-ui-frontend:my-tag .
```

See the [Operator Guide](../operator/index.md) for deployment details.

---

## Key Architectural Constraints

A few non-obvious rules that CI enforces — violating them breaks the build:

- **Never call the backend directly from the client.** All requests go through `/api` on the BFF. See [New API Requests](new-api-request.md).
- **All user-facing strings must go through `t()`.** `eslint-plugin-i18next` fails the build on hardcoded literals in JSX.
- **Pin exact versions in `package.json`.** No `^` or `~` — `npmPkgJsonLint` enforces this.
- **OpenTelemetry must be the first import in `server.ts`.** Do not reorder imports there.
- **Do not import Node's `path` from client code.** It is aliased to `path-browserify`.

Full linting rules: [Static Analysis](static-analysis.md).
