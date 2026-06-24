# Operator Guide

This guide covers deploying and running the Control Plane UI in your organisation.

## Architecture Overview

```
Browser
  └─ React 19 SPA (Vite)
       └─ /api/* (same origin)
            └─ Fastify BFF (server.ts)          ← lives in this repo
                 ├─ Encrypted cookie session + OIDC auth callbacks
                 ├─ HTTP proxy → mcp-ui-backend  (image: ghcr.io/openmcp-project/mcp-ui-backend, source not yet public)
                 └─ HTTP proxy → GraphQL Gateway (github.com/platform-mesh/kubernetes-graphql-gateway)
```

The BFF (Backend-for-Frontend) is a [Fastify](https://fastify.dev) server defined in `server.ts` — part of this repository. The client **never** contacts downstream services directly; all traffic flows through `/api` on the BFF.

- **mcp-ui-backend** — the REST backend serving Crossplane / Flux / Landscaper CRDs. Published as `ghcr.io/openmcp-project/mcp-ui-backend`; source not currently public.
- **GraphQL Gateway** — [kubernetes-graphql-gateway](https://github.com/platform-mesh/kubernetes-graphql-gateway) (public); serves the GraphQL schema consumed by the onboarding space.

### GraphQL Gateway

The onboarding space (Projects / Workspaces) is powered by Apollo Client against a remote GraphQL schema. That schema is served by the [kubernetes-graphql-gateway](https://github.com/platform-mesh/kubernetes-graphql-gateway).

### REST + SWR _(deprecated — GraphQL is the target)_

> **Note:** The REST + SWR stack is being phased out. New features should use Apollo + GraphQL. `McpPageV2` is the migration target.

The MCP space currently uses [SWR](https://swr.vercel.app) for data fetching. Routing headers (`X-project`, `X-workspace`, `X-mcp`, `X-use-crate`, `X-jq`) tell the BFF which cluster to proxy to.

## Supported Target Setup

| Component | Details |
|---|---|
| Container runtime | Docker / containerd |
| Deployment | Docker image (`ghcr.io/openmcp-project/mcp-ui-frontend`) served via nginx |
| Auth | OIDC (configurable issuer, client ID) |
| Backend | Crossplane + Flux + Landscaper CRDs via the BFF proxy |
| GraphQL | [kubernetes-graphql-gateway](https://github.com/platform-mesh/kubernetes-graphql-gateway) |

## Building the Docker Image

```bash
# Using Taskfile (recommended)
task build:image:local TAG=my-tag

# Or directly
docker build -t ghcr.io/openmcp-project/mcp-ui-frontend:my-tag .
```

## Configuration

The UI reads `frontend-config.json` at runtime. In production, nginx serves its content from the `BACKEND_CONFIG` environment variable:

```bash
docker run -p 80:80 \
  -e BACKEND_CONFIG="$(cat frontend-config.json)" \
  ghcr.io/openmcp-project/mcp-ui-frontend:latest
```

See `frontend-config.json` at the repo root for the available fields.

## OCM / Platform Service

The `ocm/` folder contains an [Open Component Model](https://ocm.software) descriptor for packaging this UI as a reusable component.

We are also working on deploying the UI as an OpenControlPlane **PlatformService** — more details coming soon.

To build and publish the OCM component:

```bash
task build:ocm OCM_COMPONENT_VERSION=v1.2.3
task publish:ocm OCM_COMPONENT_VERSION=v1.2.3
```

---

- [End User Guide](../end-user/index.md) — what users can do with the UI
- [Contributor Guide](../contributor/index.md) — architecture details and how to extend the UI
