# Telemetry

The ui-frontend emits **product analytics** (which features are used and how) and **error reports** through a single in-app service that fans out to multiple backends. This page describes how that pipeline is wired, which backends receive what, and every event the UI currently tracks — so operators know what leaves the browser and can wire up their own observability.

## Architecture

```
Application code
  └─ useTelemetry()  →  TelemetryService  ┬─► SentryAdapter    → Sentry
                                          ├─► DynatraceAdapter → window.dtrum (OneAgent)
                                          └─► ConsoleAdapter   → dev builds only
```

Every call site — a button click, a page navigation, a caught error — talks to the same `TelemetryService` interface. That service holds an ordered list of **adapters**, each of which knows how to talk to one backend. When the app fires `telemetry.track(...)`, the service dispatches to every adapter; a failure in one adapter is caught and logged but never propagates back to the caller. This means:

- **Fan-out is decided in one place** ([`src/lib/telemetry/telemetry.ts`](../../src/lib/telemetry/telemetry.ts)). To disable Dynatrace or add a new backend, only that file changes.
- **Adapters are optional at runtime.** The Dynatrace adapter checks for `window.dtrum` on every call; if the OneAgent script has not injected it (e.g. no license in this environment), the adapter is a silent no-op.
- **Dev builds emit an extra `ConsoleAdapter`** so you can see events in the browser console at `http://localhost:5173` without any backend configured.

Source: [`src/lib/telemetry/`](../../src/lib/telemetry/).

### Backends

| Adapter | Backend | Init | Purpose |
|---|---|---|---|
| `SentryAdapter` | [Sentry](https://sentry.io) | SDK initialised via [`@sentry/vite-plugin`](../../vite.config.js) at build time; runtime DSN configured in the same plugin block | Exception reporting; every tracked event also lands as a breadcrumb so the last N interactions are attached to any subsequent crash |
| `DynatraceAdapter` | [Dynatrace RUM](https://www.dynatrace.com/platform/real-user-monitoring/) | No SDK ships with the app. The Dynatrace **OneAgent** injects a `<script>` tag at request time that populates `window.dtrum` (a global object). If that script is not present, this adapter no-ops | Product analytics — every tracked event becomes a Dynatrace "user action" of type `feature` with the event properties attached |
| `ConsoleAdapter` | Browser console | Enabled only when `import.meta.env.DEV` is true (Vite dev server) | Local development visibility — nothing leaves the browser |

**No custom analytics endpoint is called from this UI.** All telemetry is delivered via the SDKs above. Anything an operator wants to intercept must be captured at those SDKs' egress points.

### What the SentryAdapter sends

- `track(...)` → `Sentry.addBreadcrumb({ message: <event-name>, data: <event-props>, category: 'ui', level: 'info' })`. Breadcrumbs are attached to any exception subsequently captured within the same session; they are **not** sent as standalone events.
- `report(err, opts)` → `Sentry.captureException(err, { extra: { message, ...context } })`. This is the only path that produces a Sentry issue.
- `identify(user)` → `Sentry.setUser({ id, email? })`. Cleared to `null` on sign-out.

### What the DynatraceAdapter sends

- `track(feature)` → `window.dtrum.enterAction(name, 'feature')` followed by `addActionProperties(id, undefined, undefined, stringProps)`, then `leaveAction(id)`. All properties are coerced to strings before submission (Dynatrace `addActionProperties` distinguishes numeric / date / string buckets; we currently use string-only).
- `report(err, opts)` → `window.dtrum.reportError(prefixed-message)`.
- `identify(user)` → `window.dtrum.identifyUser(user?.id ?? '')` (empty string clears).

## Tracked events

Events are declared as a discriminated union in [`src/lib/telemetry/features.ts`](../../src/lib/telemetry/features.ts). The full type definition **is the contract** — TypeScript will refuse to compile a `track()` call whose event name or property shape does not appear in that union.

At the time of writing, the following events are emitted from the UI. This list may drift; the file above is authoritative.

| Event | Properties | Emitted from | What it means |
|---|---|---|---|
| `kubeconfig.copied` | — | Copy button on any ControlPlane card / detail | The user copied a kubeconfig YAML block to the clipboard |
| `kubeconfig.downloaded` | — | Download button on any ControlPlane card / detail | The user downloaded a kubeconfig `.yaml` file |
| `mcp.connected` | `idp: 'system' \| 'custom'` | View / Connect button on a ControlPlane | The user navigated into a ControlPlane. `idp = 'system'` means the built-in openmcp identity provider, `'custom'` means the user picked a non-default IdP option |
| `project-list.navigated` | `trigger: 'click' \| 'keyboard'` | Project list row link | The user opened a project from the list. `trigger` records whether it was mouse or Enter-in-search |
| `project-list.set-as-default` | `trigger: 'click' \| 'keyboard'` | Project list row link, when "Remember selection" checkbox is on | The user pinned a project as their default (persisted in `localStorage`) |
| `project-list.search-enter-pressed` | — | Search input on the project list | The user pressed Enter in the search box while >1 project was still matching — signals "wants to keep filtering, not open the first hit" |

Properties are always primitive strings. This is a Dynatrace constraint (`addActionProperties` distinguishes numeric / date / string buckets and we've kept the surface narrow); the same shape happens to survive Sentry breadcrumbs cleanly.

## What is **not** tracked

By design, none of the following leaves the browser via telemetry:

- Project names, workspace names, ControlPlane names — the granularity is "the user navigated" or "the user copied a kubeconfig", never *which one*.
- Kubernetes resource contents.
- Any string typed into a form field, including the delete-confirmation input.
- Search queries.

Sentry-captured exceptions may include stack traces that reference variable names / file paths from the source map. If that is a concern in your environment, disable source map upload in [`vite.config.js`](../../vite.config.js).

## User identification

`telemetry.identify({ id, email })` is called once on sign-in (from [`AuthContextOnboarding`](../../src/spaces/onboarding/auth/AuthContextOnboarding.tsx)) and `identify(null)` on sign-out. The `id` is the OIDC `sub` claim; `email` is included when the token carries it.

Both Sentry and Dynatrace then correlate subsequent events with that user until it's cleared. If your organisation forbids user-scoped analytics, remove the `identify` call at the source rather than trying to filter it downstream — the identifier is only sent once and would otherwise persist in the RUM session cookie.

## Opting a deployment out

- **Sentry** — Set the Sentry DSN to an empty string in the build environment. The SDK is baked into the bundle but a missing DSN prevents any network egress.
- **Dynatrace** — Do not inject the OneAgent `<script>` tag in your reverse proxy / CDN. `window.dtrum` will be undefined and every adapter method becomes a no-op.
- **Everything** — There is no runtime "telemetry off" flag today. If one is needed, the change is a single check in `TelemetryService.dispatch()`; open an issue if that would be useful.

---

- [Contributor: adding telemetry to a new feature](../contributor/telemetry.md)
- Back to [Operator Guide](index.md)
