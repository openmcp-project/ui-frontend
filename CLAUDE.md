# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About This Project

This is the frontend component for the Managed Control Plane UI (MCP UI), part of the @openmcp-project. The UI enables users to work with Managed Control Planes without kubectl, focusing on displaying information about managed resources and MCP instances.

**Tech Stack:**
- React 19 with TypeScript
- UI5 Web Components React
- Vite 8 build system
- Fastify BFF (Backend for Frontend) with session management
- Apollo Client + GraphQL for data fetching (onboarding space)
- SWR for REST API calls
- React Router 7 with hash-based routing
- Cypress for component testing
- Vitest for unit testing
- Monaco Editor for YAML editing
- @xyflow/react for graph visualizations

## Development Commands

### Installation and Setup
```bash
npm i                                    # Install dependencies
cp .env.template .env                    # Create .env and fill in values
cp frontend-config.json public/          # Copy frontend config for dev
```

### Running the Application
```bash
npm run dev                              # Start dev server (http://localhost:5173)
npm run build                            # Build for production (client + server)
npm run build:client                     # Build only the client
npm run build:server                     # Build only the server
npm run preview                          # Preview production build locally
npm start                                # Start production server
```

### Testing
```bash
npm run test:cy                          # Run Cypress component tests (Chrome, headless)
npm run test:cy:open                     # Open Cypress component test runner
npm run test:vi                          # Run Vitest unit tests
```

### Code Quality
```bash
npm run lint                             # Run ESLint + package.json lint
npm run lint:eslint                      # Run ESLint only
npm run lint:eslint:fix                  # Auto-fix ESLint issues
npm run type-check                       # TypeScript type checking (no emit)
```

### GraphQL Types Generation
```bash
npm run generate-graphql-types -- <access-token>        # Generate types from remote schema
npm run generate-graphql-types:watch -- <access-token>  # Watch mode for auto-regeneration
```

The token is automatically prefixed with `Bearer` when fetching the schema. Generated types go to `src/types/__generated__/graphql/`.

## Architecture

### Application Structure

**Routing:** Hash-based routing via React Router 7 (`HashRouter`). Main routes are under `/mcp` prefix:
- `/mcp/projects` - Project list view
- `/mcp/projects/:projectName` - Project detail page
- `/mcp/projects/:projectName/workspaces/:workspaceName/mcps/:controlPlaneName` - MCP detail (v1)
- `/mcp/projects/:projectName/workspaces/:workspaceName/mcpsv2/:controlPlaneName` - MCP detail (v2)

**Spaces Architecture:** The codebase uses a "spaces" pattern to organize features:
- `src/spaces/onboarding/` - Onboarding space with GraphQL-based API integration, auth handling, workspace/project/MCP management
- `src/spaces/mcp/` - MCP space with detailed component views, KPIs, dashboards

Each space has its own hooks, services, and components specific to that domain.

**Provider Hierarchy (from main.tsx):**
1. `Sentry.ErrorBoundary` - Error tracking
2. `FrontendConfigProvider` - Dynamic frontend config from `/frontend-config.json`
3. `FeatureToggleProvider` - Feature flags
4. `AuthCallbackHandler` - OAuth callback handling
5. `AuthProviderOnboarding` - Authentication context
6. `ThemeProvider` (UI5) - Theming
7. `ToastProvider` - Toast notifications
8. `CopyButtonProvider` - Clipboard utilities
9. `SWRConfigWithTokenRefresh` - SWR config with auto token refresh
10. `ApolloClientProvider` - GraphQL client
11. `App` - Main application component

**BFF Server (server.ts):** Fastify-based BFF that:
- Serves the Vite-built SPA
- Proxies API requests to backend (via `/api` prefix)
- Handles secure sessions with encrypted cookies
- Integrates OpenTelemetry instrumentation
- Configures Sentry error tracking
- Applies security headers via Helmet
- Manages CORS for cross-origin requests

### Key Directories

- `src/components/` - Shared React components organized by domain (Core, Shared, Ui, Dialogs, etc.)
- `src/spaces/` - Feature spaces (onboarding, mcp) with domain-specific code
- `src/hooks/` - Shared React hooks
- `src/lib/` - Library code (API utilities, Monaco config, Sentry, shared utilities)
- `src/context/` - React contexts (FrontendConfig, Toast, CopyButton, FeatureToggle, etc.)
- `src/utils/` - Utility functions and testing utilities
- `src/types/` - TypeScript type definitions, including `__generated__/` for GraphQL types
- `server/` - Fastify BFF server code (routes, plugins, config, session handling)

### Data Fetching Patterns

**REST APIs (via SWR):**
- Use `useApiResource` hook from `src/lib/api/useApiResource.ts`
- Automatic token refresh via `SWRConfigWithTokenRefresh`
- Error handling with `isForbiddenError` utility

**GraphQL (via Apollo Client):**
- Used in onboarding space for projects, workspaces, MCPs
- Custom hooks in `src/spaces/onboarding/hooks/` (e.g., `useWorkspacesQuery`, `useMcpsQuery`)
- Token refresh handled via `tokenRefresh.ts`

### Testing Patterns

**Cypress Component Tests:**
- Place test files next to components as `*.cy.tsx`
- Use `cy.mount()` which wraps components with `ThemeProvider`, `ToastProvider`, and `FrontendConfigContext`
- Custom mount command defined in `cypress/support/component.tsx`
- Use `mockedFrontendConfig` from `src/utils/testing.ts` for consistent test data
- Cypress ignores specific Monaco/module loading errors during teardown (configured in support file)

**Vitest Unit Tests:**
- Place test files as `*.spec.ts` or `*.spec.tsx`
- Use utilities from `src/utils/test/vitest-utils.ts`
- JSdom environment configured in `vite.config.js`

**Important:** When writing tests, use `cy.mount()` for Cypress tests, which automatically provides required context providers. For tests requiring additional providers (e.g., Apollo, Auth), wrap components explicitly.

## Important Implementation Details

### Safari Local Development
Safari is incompatible with `localhost` by default. To enable:
1. Set `secure: false` in both occurrences in `server/encrypted-session.ts`
2. Comment out/remove `helmet` registration in `server.ts`

### Frontend Config
Dynamic config loaded from `/frontend-config.json`:
- **Dev:** Copy `frontend-config.json` to `public/frontend-config.json`
- **Prod:** Nginx serves from `BACKEND_CONFIG` environment variable

### Monaco Editor
Monaco is configured in `src/lib/monaco.ts` with YAML schema support. The `vs` directory is copied to build output via `vite-plugin-static-copy`.

### Session Management
Secure sessions use encrypted cookies via `@fastify/secure-session`. Session and cookie secrets must be set in `.env` (min 32 characters). Use `require('crypto').randomBytes(32).toString('hex')` to generate.

### Environment Requirements
- Node.js: ^24.0.0
- npm: ^11.0.0

### Git Workflow
- Main branch: `main`
- Create issues before implementing changes
- Contributors must accept DCO (Developer Certificate of Origin)
- Follow [CONTRIBUTING.md](CONTRIBUTING.md) guidelines

### Security & Monitoring
- Sentry integration for frontend and BFF error tracking
- OpenTelemetry instrumentation for observability
- Dynatrace RUM script injection support
- CSP headers configured via Helmet
- All dependencies use exact versions (enforced by npm-package-json-lint)

## Code Conventions

- Use TypeScript strict mode
- Follow ESLint config (React, TypeScript, Prettier, import order, a11y, i18next)
- Use UI5 Web Components React for UI elements
- Leverage existing utility functions in `src/utils/` and `src/lib/shared/`
- Keep components focused and domain-specific
- Use React hooks for state and side effects
- Prefer composition over inheritance
