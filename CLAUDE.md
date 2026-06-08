# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`ui-frontend` is the openmcp-project (SAP, OSS) Managed Control Plane (MCP) UI. Users view, status-check, and YAML-preview/copy Kubernetes resources without `kubectl`. The frontend is a React 19 SPA served by a Fastify BFF; backend domain objects come from Crossplane, Flux, and Landscaper CRDs (see `src/lib/api/types/{crossplane,flux,landscaper,k8s,crate}`). The `ocm/` folder is for [Open Component Model](https://ocm.software) packaging — unrelated to the React app.

Node `^24.0.0` and npm `^11.0.0` are required (`package.json` `engines`).

## Stack — non-obvious points

- **Fastify BFF, not static Vite.** Entry is `server.ts` (TS) → builds to `dist/server.js`. Dev = `tsx ./server.ts --local-dev` (Fastify with `@fastify/vite` middleware on `http://localhost:5173`). Prod = `node dist/server.js` serving `dist/client/`. The client always talks to `/api/...` on the BFF; the BFF proxies to the real backend (`server/plugins/http-proxy.ts`) and handles encrypted cookie sessions + OIDC auth callbacks (`server/routes/auth-*.ts`). Never call the backend directly from the client.
- **`@ui5/webcomponents-react` is the design system.** Before building any button / input / dialog / table / form layout, look it up in `@ui5/webcomponents-react` or `@ui5/webcomponents-fiori`. Custom primitives are reserved for things UI5 genuinely doesn't offer (and even then, look in `src/components/Ui/` first). Charts come from `@ui5/webcomponents-react-charts`.
- **Apollo Client 4 + GraphQL codegen.** The onboarding space (`src/spaces/onboarding/`) uses Apollo against `/api/onboarding/graphql`. **All GraphQL response types are generated** into `src/types/__generated__/graphql/` by `@graphql-codegen/client-preset` using `graphql.config.yaml`. Do not hand-write GraphQL response types — regenerate with `npm run generate-graphql-types -- <token>` (token is prefixed with `Bearer` and used to fetch the remote schema).
- **REST + SWR for MCP space.** `src/spaces/mcp/` and shared `src/lib/api/useApiResource.ts` use SWR. Routing headers (`X-project`, `X-workspace`, `X-mcp`, `X-use-crate`, `X-jq` for server-side jq filtering) are how the BFF routes a single fetch to the right cluster. State is **SWR cache + Apollo cache** — there is no Redux/Zustand/MobX. Don't introduce one.
- **i18next + `eslint-plugin-i18next`.** All user-facing strings go through `t()`. Hardcoded literals in JSX will fail lint. The rule is disabled only in `*.cy.tsx`. Translations live in `src/utils/i18n/`.
- **Monaco editor + `monaco-yaml`** power the YAML editor for k8s resources. `configureMonaco()` runs in `main.tsx`; the `vs` assets are static-copied at build time (`vite.config.js`). Don't import `monaco-editor` ad-hoc — go through `src/lib/monaco.ts`.
- **Forms: `react-hook-form` + `zod` + `@hookform/resolvers`.** Define a Zod schema, wire it with `zodResolver`, drive UI5 inputs via RHF's `Controller`. See `src/components/Dialogs/CreateGitRepositoryDialog.tsx` for the canonical pattern.
- **Routing: `react-router-dom` v7** in HashRouter mode (`src/AppRouter.tsx`). Sentry-wrapped routes via `SentryRoutes` from `src/mount.ts`.
- **Two auth spaces.** `AuthContextOnboarding` (top level: projects/workspaces, GraphQL) and `AuthContextMcp` (drilled-in MCP page, REST). Each has its own `tokenRefresh.ts`; the shared `SWRConfigWithTokenRefresh` wires both refreshers into SWR's error handling. There are V1 (`McpPage`) and V2 (`McpPageV2`, GraphQL-driven) MCP pages — both routes exist; V2 is the migration target.
- **Observability.** Sentry on client + server (source maps uploaded via `@sentry/vite-plugin` — `build.sourcemap: true` is required). OpenTelemetry must be the **first import** in `server.ts` (`./server/opentelemetry-init.js`) or instrumentation breaks.
- **Dynamic config.** `frontend-config.json` (backend URL etc.) is loaded at runtime. Locally that's `public/frontend-config.json` (gitignored); in prod NGINX writes it from the `BACKEND_CONFIG` env var. Read it via `FrontendConfigContext` — never hardcode URLs.

## Layout

```
server.ts, server/      Fastify BFF: encrypted-session, auth routes, http-proxy, OTel, env
src/
  App.tsx, AppRouter.tsx, main.tsx, mount.ts
  common/auth/          Shared auth callback handler & redirect helpers
  components/           PascalCase folders: ControlPlane, ControlPlanes, Projects,
                        Members, Wizards, Dialogs, Graphs, Yaml, YamlEditor,
                        ComponentsSelection, HintsCardsRow, Splitter, Ui, Core,
                        Helper, Shared
  context/              React contexts (FrontendConfig, FeatureToggle, Toast, …)
  hooks/                Cross-space hooks (create/update/delete resources, etc.)
  lib/api/              REST client, ApiConfig, fetchApiServer, Zod validations,
                        domain types (crossplane/flux/landscaper/k8s/crate/…)
  lib/{monaco,sentry,shared}/
  spaces/onboarding/    GraphQL + Apollo: projects, workspaces, SignInPage
  spaces/mcp/           REST + SWR: drilled-in MCP page, Kpi widgets, schemas
  types/__generated__/  GraphQL codegen output — DO NOT EDIT
  utils/                Pure utilities + i18n setup
  views/                Top-level route views
ocm/                    Open Component Model descriptor — not React
scripts/                generate-graphql-types{,-watch}.sh
cypress/                Cypress component-test support
```

## Tests

- **Vitest** for unit tests (`*.spec.ts`, `*.spec.tsx`) — jsdom environment.
- **Cypress component tests** (`*.cy.tsx`) — `--component` flag, Chrome, `includeShadowDom: true` so UI5 web components are queryable. No e2e tests here.

Run a single file:
```
npm run test:vi -- src/hooks/useCreateProject.spec.ts
npm run test:cy -- --spec 'src/components/Dialogs/CreateProjectDialogContainer.cy.tsx'
```

## Quality gates (hard fails)

These break CI; don't paper over them:

- `eslint --max-warnings 0` — warnings are errors. Don't relax to `--max-warnings auto` or use `--no-verify`.
- `npm-package-json-lint` enforces `prefer-absolute-version-dependencies` / `…-devDependencies` — **pin exact versions**, no `^` or `~` in `package.json`.
- `tsc --noEmit` via `npm run type-check`.
- `prettier` via `eslint-plugin-prettier/recommended`.
- Notable ESLint rules: `react/jsx-sort-props` (callbacks last, no alpha sort, reserved first), `react/self-closing-comp`, `i18next/no-literal-string`.

## Dev setup

```
npm i
cp frontend-config.json public/frontend-config.json   # edit backendUrl
cp .env.template .env                                 # fill OIDC, secrets, etc.
npm run dev                                           # http://localhost:5173
```

Safari on `localhost` has a cookie/CSP quirk — see README.md ("Safari Support") for the manual `secure: false` + helmet workaround. Do not commit those edits.

### Claude Code hooks + nvm

Hooks are invoked as `node .claude/hooks/*.mjs` (cross-platform). But `/bin/sh` and `cmd` don't inherit nvm/fnm PATH, so `node` must be reachable without an interactive shell.

**Fix:** macOS/Linux: `ln -sf "$(nvm which default)" /usr/local/bin/node` · Windows: add nvm's Node directory to the **system** PATH (not just user profile).

## Compliance

- SAP OSS project, Apache-2.0. `REUSE.toml` sets a repo-wide default (`SPDX-FileCopyrightText: 2025 SAP SE … contributors`, `SPDX-License-Identifier: Apache-2.0`) with `precedence = "closest"`, so most new files inherit headers automatically. If you add a file in a directory with explicit per-file headers (check neighbors), match that style. Third-party files go under `LICENSES/`.
- Read `CONTRIBUTING.md` before merging — DCO is required, contributions need an issue first.

## Don't

- Don't build a custom `Button` / `Input` / `Dialog` / `Table` / `Form` when UI5 has one. Search `@ui5/webcomponents-react` first.
- Don't hardcode user-facing strings — `eslint-plugin-i18next` will fail the build.
- Don't hand-write GraphQL response types — regenerate them.
- Don't use `^` or `~` ranges in `package.json` — `npmPkgJsonLint` will fail.
- Don't commit `.env` or `public/frontend-config.json` (both gitignored).
- Don't suppress `--max-warnings 0`, don't `--no-verify`, don't `eslint-disable` an entire file to make a PR green.
- Don't import Node's `path` from client code — it's aliased to `path-browserify` in `vite.config.js` and `cypress.config.ts`.
- Don't reorder imports in `server.ts` — `./server/opentelemetry-init.js` must come first.
- Don't talk to the backend directly from the client — go through `/api` on the BFF.

### GraphQL types — user-only command

  `npm run generate-graphql-types` and `npm run generate-graphql-types:watch`
  require a bearer token for the remote GraphQL schema. **Do not run these
  commands yourself.** The user holds the token in their password manager
  and runs codegen manually when the schema changes.

  If you detect that GraphQL types are out of date (TS errors referencing
  generated types, schema drift after `git pull`, new query/mutation in
  code with no matching generated type), **stop and ask the user to run
  codegen**. Do not:

  - Run the command with a placeholder token (it will fail and waste a turn).
  - Run it with a token you found in chat history, .env, or any other file
    (the project security hook will block plain-text tokens — and even if
    it didn't, this is exactly the leak path we are preventing).
  - Suggest hardcoding the token anywhere.

  If the user explicitly asks you to run it and provides the token via
  env var (`$env:GRAPHQL_TOKEN` on PowerShell, `$GRAPHQL_TOKEN` on bash),
  that is acceptable. Never echo the token value back, even partially.

## Commands cheatsheet

```
npm run dev                         # tsx server.ts --local-dev
npm run build                       # build:server (tsc) + build:client (vite)
npm run start                       # node dist/server.js
npm run preview                     # vite preview (client only)

npm run lint                        # eslint --max-warnings 0 + npmPkgJsonLint
npm run lint:eslint:fix             # autofix
npm run type-check                  # tsc --noEmit

npm run test:vi                     # vitest
npm run test:vi -- <file>           # single Vitest file
npm run test:cy                     # cypress run --component --browser chrome
npm run test:cy:open                # cypress interactive
npm run test:cy -- --spec <file>    # single Cypress component spec
```
