# Running the app with a mocked GraphQL backend

> **Status:** proposal / implementation guide.
> **Audience:** `ui-frontend` contributors who need to run the SPA when the real
> GraphQL gateway is unavailable (outage, offline work, demos, deterministic
> local dev).

## 1. Problem & goal

The onboarding/MCP data in this app comes from a remote GraphQL gateway
(configured in `graphql.config.yaml`). When that gateway is down, every
`/api/graphql` call fails and the data screens are stuck on spinners.

**Scope (important):** only the **GraphQL** gateway is being mocked. The REST
API and the auth/OIDC endpoints (`/api/auth/onboarding/*`, `/api/onboarding/*`)
**still work** and are **not** mocked — you log in for real and keep hitting the
real backend for everything except GraphQL.

**Goal:** a `npm run dev:mock` command that boots the app, lets you log in
normally, and serves deterministic, in-repo responses **only for `/api/graphql`**
— generated from the operations and types we already have. Every other request
passes straight through to the working BFF.

Non-goals: this is a **developer convenience**, not a test harness replacement
and not something that ships to production. Mock code must stay out of the prod
bundle.

## 2. How GraphQL actually flows today (findings)

Before choosing a mocking strategy, these are the facts that constrain it:

| Concern | Reality in this repo |
|---|---|
| Apollo | Single `ApolloClient` v4 instance in [`ApolloClientProvider.tsx`](../../src/spaces/onboarding/services/ApolloClientProvider.tsx), mounted in [`main.tsx`](../../src/main.tsx). |
| Endpoint | Client always calls `/api/graphql` (relative). |
| Transport split | `splitLink`: **subscriptions → SSE** (`graphql-sse`, `SSELink`), **queries/mutations → HTTP POST** (`HttpLink`). |
| Link chain | `errorLink → tokenRefreshLink → authLink → split(sseLink, httpLink)`. `tokenRefreshLink` calls `refreshToken()` before every non-subscription op. |
| BFF | `server/plugins/http-proxy.ts` proxies `/api/graphql` → `GRAPHQL_BACKEND_URL`, injecting a `Bearer` token from the encrypted session. App is mounted under `/api` (`server.ts:181`). |
| Auth gate | `AuthProviderOnboarding` calls `GET /api/auth/onboarding/me` on mount; `POST /api/auth/onboarding/refresh` renews tokens. **These are real REST endpoints and still work — leave them unmocked** so login proceeds normally. |
| Operations | ~32 queries, ~35 mutations, **3 subscriptions** (`McpV1Subscription`, `McpV2Subscription`, `WorkspacesSubscription`). |
| Schema source | **Remote only** (`graphql.config.yaml`) — there is **no local SDL / introspection file**, and codegen can't run while the server is down. |
| Types | `src/types/__generated__/graphql/graphql.ts` (already committed) is the de-facto local source of truth for every response shape. |
| Existing fixtures | `MockedProvider` payloads in `*.cy.tsx` (e.g. `ControlPlaneCardMenuV2.cy.tsx`, `ConnectButton.cy.tsx`) and plain data objects in `*.spec.ts` (e.g. `validCrossplane` in `useCrossplaneQuery.spec.ts`). |

Two consequences fall straight out of this:

1. **Mocks must be built from the generated types**, not from the (unreachable)
   schema. That's fine — `graphql.ts` already encodes every operation's shape.
2. **Intercept `/api/graphql` only.** Auth and the rest of the REST API work, so
   the mock layer must scope itself narrowly to GraphQL and let every other
   request (login, `/me`, `/refresh`, SWR calls) pass through to the real BFF.
   Since `tokenRefreshLink` runs `refreshToken()` before each GraphQL op, that
   refresh simply hits the real (working) endpoint — no special handling needed.

## 3. Options considered

### A. MSW (Mock Service Worker) — **recommended**

A Service Worker intercepts `fetch` at the network boundary *inside the browser*.
Apollo, the link chain, auth refresh, and the `/api/...` URLs all stay
**completely unchanged** — the request simply never leaves the browser.

- ✅ Industry-standard best practice for mocking in React apps (dev **and** tests).
- ✅ Native GraphQL support keyed by **operation name** (`graphql.query('GetMCPsList', …)`), so no brittle exact query+variables matching — important for an app that polls.
- ✅ Scopes cleanly to GraphQL: register only `graphql.*` handlers and set `onUnhandledRequest: 'bypass'` so **auth and every REST call flow through to the real, working backend** untouched.
- ✅ Handlers are typed against the generated types; fixtures are reusable in Vitest.
- ✅ Zero changes to `ApolloClientProvider`; opt-in via one env flag + dynamic import ⇒ nothing in the prod bundle.
- ⚠️ **SSE subscriptions** (`graphql-sse`) are the weak spot: MSW's streaming support does not speak the `graphql-sse` wire protocol out of the box. Handled by a small fallback (see §6.4).

### B. Apollo `MockLink` / `MockedProvider` at app level

Swap the client's link for Apollo's testing `MockLink` when a flag is set.

- ✅ No service worker; reuses existing `*.cy.tsx` request/result payloads directly.
- ❌ `MockLink` matches on **exact query + variables** and is one-shot by default; our polling hooks (`useProjectsQuery` every 30s, `useMcpsQuery`) would exhaust mocks and error. Great for component tests, poor for "run the whole app."
- ❌ Doesn't help with the auth gate (it's REST, not Apollo).

### C. BFF-level mock (Fastify)

When `MOCK_GRAPHQL=true`, skip the proxy registration and serve `/api/graphql`
(and the auth routes) from local handlers.

- ✅ Fits the existing architecture; **can fully mock SSE subscriptions** server-side; zero client changes.
- ❌ You re-implement response assembly by `operationName` on the server, plus stub the session/OIDC callback so the app thinks it's logged in. More plumbing, and it doesn't double as a test tool. Keep as a **future enhancement for subscriptions** if needed.

### D. Standalone `@graphql-tools/mock` server from the SDL

- ✅ Most realistic; auto-generates data from schema types.
- ❌ **Requires the SDL**, which is exactly what's unavailable (server down, no local copy). Blocked today.

**Decision: go with A (MSW)** scoped to `/api/graphql` only (auth + REST stay
real), with a small client-side fallback for the 3 subscriptions. It's the
best-practice React answer, reuses our fixtures, survives polling, and keeps mock
code out of prod.

## 4. Reusable assets already in the repo

Don't write fixtures from scratch — harvest these first:

- `src/spaces/controlPlaneV2/components/Kpi/*.spec.ts` — `validCrossplane`,
  `validFlux`, etc. plausible component payloads.
- `src/components/ControlPlanes/**/*.cy.tsx` — `MockedProvider` `request/result`
  pairs for `GetKubeconfig`, control-plane cards, the create-MCP wizard.
- `src/spaces/onboarding/hooks/*.spec.ts` — `resourceRules`, workspace/project
  payloads (e.g. the `useProjectsQuery.spec.ts` resourceRules block).
- `src/types/__generated__/graphql/graphql.ts` — the authoritative shape of every
  `*Query` / `*Mutation` result type; use it to type each handler's response.

## 5. Target layout

```
src/mocks/
  browser.ts            # setupWorker(...handlers) + startMockWorker()
  handlers/
    index.ts            # aggregates all GraphQL handlers
    onboarding.ts       # GetWorkspaces, projects, SelfSubjectRulesReview, ...
    controlPlaneV2.ts   # GetMCPsList, GetMCPv2, Kpi queries, create/delete, ...
    subscriptions.ts    # mock SSE link factory (see §6.4)
  fixtures/
    workspaces.ts
    controlPlanes.ts
    user.ts
    ...
public/
  mockServiceWorker.js  # generated by `npx msw init` (commit it)
```

Rationale: `src/mocks/` is the MSW convention; one handler file per domain keeps
diffs reviewable; fixtures separated so they're importable from Vitest too. Note
there is **no `auth.ts`** — auth is real and unmocked.

## 6. Implementation steps

### 6.1 Install & pin MSW

```bash
npm i -D msw@latest
```

Then **pin the exact version** in `package.json` (no `^`/`~` — `npmPkgJsonLint`'s
`prefer-absolute-version-dependencies` will fail CI otherwise). Generate the
worker script and commit it:

```bash
npx msw init public/ --save
```

> `mockServiceWorker.js` must live under `public/` so Vite serves it at the root
> scope. It is a generated artifact — commit it; don't hand-edit it.

### 6.2 Fixtures (typed from generated types)

Build small, composable fixtures and **type them against the generated result
types** so they can't drift from the real schema shape:

```ts
// src/mocks/fixtures/controlPlanes.ts
import type { GetMcPsListQuery } from '../../types/__generated__/graphql/graphql';

export const mcpsList: GetMcPsListQuery = {
  core_openmcp_cloud: {
    v1alpha1: {
      ManagedControlPlanes: {
        items: [
          {
            metadata: {
              uid: 'uid-mcp-1',
              name: 'demo-mcp',
              namespace: 'project-demo--ws-main',
              creationTimestamp: '2026-01-01T00:00:00Z',
              annotations: {},
            },
            // ...fill the rest from the query selection set; TS will flag gaps
          },
        ],
      },
    },
  },
} as GetMcPsListQuery;
```

> Tip: copy the **selection set** from each `graphql(\`...\`)` document and let
> TypeScript's errors drive which fields you must provide. Reuse the `*.spec`
> payloads from §4 wherever they exist.

### 6.3 Handlers keyed by operation name

```ts
// src/mocks/handlers/controlPlaneV2.ts
import { graphql, HttpResponse } from 'msw';
import { mcpsList } from '../fixtures/controlPlanes';

// Scope handlers to our single GraphQL endpoint so nothing else is touched.
const api = graphql.link('/api/graphql');

export const controlPlaneV2Handlers = [
  api.query('GetMCPsList', () => HttpResponse.json({ data: mcpsList })),
  api.query('GetMCPv2', ({ variables }) => {
    // branch on variables when you need per-MCP data
    return HttpResponse.json({ data: /* ... */ });
  }),
  api.mutation('CreateManagedControlPlaneV2', () =>
    HttpResponse.json({ data: { /* echo back a created MCP */ } }),
  ),
  // ...one entry per operation you need
];
```

```ts
// src/mocks/handlers/index.ts — GraphQL only; auth/REST stay real
import { onboardingHandlers } from './onboarding';
import { controlPlaneV2Handlers } from './controlPlaneV2';

export const handlers = [...onboardingHandlers, ...controlPlaneV2Handlers];
```

> **Do not** add `http.*` handlers for `/api/auth/*` or other REST routes — those
> endpoints work and must reach the real backend. `onUnhandledRequest: 'bypass'`
> (§6.5) guarantees anything without a GraphQL handler passes through.

### 6.4 Subscriptions (the SSE caveat)

The 3 subscriptions go over `graphql-sse`, which MSW won't transparently serve.
Two pragmatic options — pick one:

- **Simplest:** in mock mode, replace `SSELink` with a tiny mock `ApolloLink`
  that emits one canned payload (or a short scripted sequence) and completes.
  Gate it behind the same flag inside `ApolloClientProvider`:

  ```ts
  const useMocks = import.meta.env.VITE_MOCK_GRAPHQL === 'true';
  const subscriptionLink = useMocks ? createMockSubscriptionLink() : sseLink;
  ```

  `createMockSubscriptionLink()` returns an `ApolloLink` whose `request()` returns
  an `Observable` that pushes fixture data keyed by `getMainDefinition(query)`
  operation name. The HTTP queries/mutations still go through MSW untouched.

- **Fuller fidelity (future):** mock subscriptions at the BFF (option C) where a
  real SSE endpoint is easy to serve. Only worth it if live-updating UI is being
  developed.

For "the server is down, let me use the app" the first option is enough — most
screens render from queries; subscriptions are incremental updates.

### 6.5 Start the worker behind a flag (keep it out of prod)

```ts
// src/mocks/browser.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export async function startMockWorker() {
  const worker = setupWorker(...handlers);
  await worker.start({
    onUnhandledRequest: 'bypass', // auth, REST, Vite assets → real backend
  });
}
```

```tsx
// src/main.tsx — BEFORE rendering the app, dynamic-import so MSW never
// enters the production bundle. Must await so handlers are ready first.
if (import.meta.env.VITE_MOCK_GRAPHQL === 'true') {
  const { startMockWorker } = await import('./mocks/browser');
  await startMockWorker();
}
// ...existing createRoot(...).render(...)
```

The `import.meta.env.VITE_MOCK_GRAPHQL === 'true'` guard is statically analysable,
so the dynamic `import('./mocks/browser')` is tree-shaken out of prod builds. The
repo already reads `import.meta.env.*` (see `src/lib/telemetry/telemetry.ts`), so
this fits existing conventions.

### 6.6 The command

```jsonc
// package.json "scripts"
"dev:mock": "VITE_MOCK_GRAPHQL=true tsx ./server.ts --local-dev"
```

> `tsx` inherits `process.env`, and Vite exposes `VITE_`-prefixed vars to the
> client as `import.meta.env.VITE_MOCK_GRAPHQL`. On Windows prefer
> [`cross-env`](https://www.npmjs.com/package/cross-env) (pin it) for the inline
> env var: `"dev:mock": "cross-env VITE_MOCK_GRAPHQL=true tsx ./server.ts --local-dev"`.

Because REST and auth are **not** mocked, mock mode needs the same working dev
setup as normal `npm run dev`: a valid `public/frontend-config.json` and `.env`
(OIDC/session), so real login and REST calls succeed. Only `/api/graphql` is
served from fixtures.

## 7. How to generate the mocks (methodology)

For each operation you need:

1. **List operations** — grep the `graphql(\`...\`)` documents:
   ```bash
   grep -rhoE "(query|mutation|subscription) [A-Za-z0-9_]+" src \
     --include='*.ts' --include='*.tsx' | sort -u
   ```
2. **Find the result type** — every operation `X` has `XQuery` / `XMutation` in
   `src/types/__generated__/graphql/graphql.ts`. Use it to type the fixture.
3. **Prefer an existing fixture** (§4) — copy and adapt before inventing data.
4. **Write a `graphql.query/mutation('<OperationName>', …)` handler** returning
   `{ data: <typed fixture> }`.
5. **Prioritise** — you don't need all ~70 operations on day one. Start with the
   landing path: `GetWorkspaces` + `CreateSelfSubjectRulesReview` (projects list)
   → `GetMCPsList` → `GetMCPv2` + the Kpi queries. Add the rest on demand; any
   unhandled op with `onUnhandledRequest: 'bypass'` just fails like today, so
   gaps are obvious and safe.

## 8. Verification

1. `npm run dev:mock` → open `http://localhost:5173`.
2. Log in normally (real OIDC) — the auth flow is untouched.
3. DevTools console shows MSW's `[MSW] Mocking enabled` banner; the network panel
   shows `/api/graphql` resolved by the worker while `/api/auth/*` and other REST
   calls still hit the real backend.
4. Drill into an MCP → V2 page renders from mocked queries.
5. `npm run build` → grep the output to confirm **no `msw` chunk** ships:
   ```bash
   npm run build && ! grep -rq "msw" dist/client/assets
   ```

## 9. Repo-specific gotchas (don't trip CI)

- **Pin exact versions** for `msw` (and `cross-env` if used) — no `^`/`~`.
- **`eslint --max-warnings 0`** — mock files are real source; no stray
  `eslint-disable`-whole-file, respect `jsx-sort-props` etc.
- **i18n rule** is scoped off only for `*.cy.tsx`; mock fixtures are `.ts`, so
  any user-facing string literals you put in fixture *data* are fine (they're
  data, not JSX), but keep real UI strings out of mock code.
- **No prod leakage** — the dynamic-import guard in §6.5 is load-bearing; don't
  statically `import` the mocks at module top level.
- **SPDX/REUSE** — new files under `docs/`/`src/` inherit the repo-wide
  Apache-2.0 header via `REUSE.toml` (`precedence = "closest"`); only add an
  explicit header if neighbouring files have one.
- **Don't run `generate-graphql-types`** to "refresh" anything — it needs the
  (down) server and a bearer token, and is user-only per `CLAUDE.md`. Mocks are
  built from the already-committed generated types instead.

## 10. Summary

| | |
|---|---|
| **Approach** | MSW scoped to `/api/graphql` only; mock `ApolloLink` for the 3 SSE subscriptions. Auth + REST stay real. |
| **Command** | `npm run dev:mock` (`VITE_MOCK_GRAPHQL=true`). |
| **Mock source** | Generated types (`graphql.ts`) + harvested `*.spec`/`*.cy` fixtures. |
| **Prod safety** | Opt-in flag + dynamic import ⇒ zero footprint in the production bundle. |
| **Known limit** | Subscriptions use a scripted canned feed, not a live stream. |
