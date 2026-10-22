# Whitelabel Solution for ui-frontend — Design Specification

**GitHub Issue:** [#595 — Develop Webapp as a Whitelabel solution](https://github.com/openmcp-project/backlog/issues/595)  
**Status:** Needs Refinement  
**Milestone:** Q4/26

---

## Executive Summary

The ui-frontend must be deployable by any organization running the Open Control Plane stack without forking the repository or patching source code. Customization is achieved purely through runtime configuration — the existing `frontend-config.json` plus a brand-asset directory mounted at deploy time — so the same published Docker image can be deployed by any organization under its own identity.

**Design principle for this cut:** reuse the mechanisms that already exist (`frontend-config.json`, the `FRONTEND_CONFIG_PATH` copy-at-startup pattern, the same-origin static root, i18n interpolation). Add the minimum new surface. Defer anything speculative until a concrete deployment asks for it.

---

## Scope Model & Hard Constraints

Read this before everything else — it bounds every decision below.

### One deployment per organization (not per-request multi-tenancy)

Config is resolved **once at page load / startup**, not per request. This spec assumes **one deployment per organization**: each org pulls the same image and configures it at install time. We are **not** building one instance that brands itself per HTTP request — that would need a tenant-routing layer that does not exist. If that is ever required, it is a separate epic.

### Content-Security-Policy constrains where assets may live

The BFF sets a strict CSP in [`server.ts`](../server.ts) (`onSend` hook): `img-src 'self' data:`, `style-src 'self' 'unsafe-inline'`.

Consequence: **brand assets must be same-origin** (served from the app's own static root) or **`data:` URIs**. External CDN image/CSS URLs are blocked by the browser unless the origin is added to the CSP. The design therefore serves all brand assets same-origin — no CSP changes needed.

### Standalone and embedded (Hyperspace Portal / Luigi) modes — both covered, same config

The app runs standalone *and* embedded in SAP's Hyperspace Portal (Luigi micro-frontend: `HYPERSPACE_PORTAL_CONFIG_PATH`, `NotInLuigiView`, `useLuigiNavigate`, `ProjectChooser`). "Hyperspace Portal" is a real integration name, not stray text.

**Decision:** the portal name is whitelabel-able through the **same `frontend-config.json`** via `branding.portalName`, interpolated into the `NotInLuigiView` strings (`"Opened outside of {{portalName}}"`). The *functional* Luigi runtime config (`hyperspace-portal-config.json`) is a separate concern (navigation/context) and stays as-is; only the visible naming moves into `branding`. One config surface, no SAP-internal carve-out.

---

## Perspectives

### Product Manager / Business Analyst

**Goal:** wider adoption by making the product organization-agnostic. Orgs avoid the UI today because it ships SAP-specific branding they cannot reuse.

**Value:** any org deploys under its own name and visuals with no fork and no per-org build; one image serves everyone; new features propagate automatically.

**Acceptance criteria:**

| # | Item | Covered by |
|---|---|---|
| AC-1 | App name configurable (browser tab + ShellBar header) | `branding.appName`, client-side `document.title` |
| AC-2 | Logo & hero image replaceable | `branding.logo` / `heroImage` as Base64 data URIs in config |
| AC-3 | Favicon replaceable | Operator overrides files in the static root (no code) |
| AC-4 | Documentation links configurable | Route through existing `documentationBaseUrl` |
| AC-5 | Feedback link configurable | `feedbackUrl` (hidden when unset) |
| AC-6 | Observability configurable | Already env-driven (Sentry/Dynatrace/Matomo); + `OTEL_SERVICE_NAME` |
| AC-7 | Portal name configurable | `branding.portalName` interpolated into i18n |
| AC-8 | Funding logo opt-in | `branding.showFundingLogo` (default false) |
| AC-9 | No hardcoded SAP product names in translations | `en.json` audit + interpolation |

**Out of scope (this cut):** per-user personalization; languages beyond `en`; runtime translation-override engine; custom CSS themes; per-request multi-tenancy; dynamic PWA manifest. See *Deferred* section for the rationale on each.

### UX Designer

Brand-sensitive surfaces, in journey order:

1. **Browser tab** — `document.title` (set client-side from `appName`).
2. **Sign-in page** — hero image, welcome message, funding logo.
3. **App shell (ShellBar)** — brand logo (top-left), primary title.
4. **"Not in portal" error** — `NotInLuigiView`, portal name.
5. **Links** — Projects "Learn more", Identity Provider guide, Feedback.

**Requirements:**
- Null/failed logo → **neutral monogram placeholder**, never the SAP logo (see Legal). No broken `<img>` ever.
- Tab title and ShellBar title come from the same `appName`.
- Funding logo (BMWK/EU) hidden unless `showFundingLogo` is true.

> **Legal / trademark (hard requirement):** the SAP logo and the BMWK/EU funding logo carry specific usage rights. A third-party deployment must not ship or fall back to the SAP logo; the funding logo defaults to hidden. This is why the null-logo fallback is a brand-neutral placeholder, not the bundled SAP asset.

### Graphic Designer

| Asset | Format | Current default | Replace via |
|---|---|---|---|
| ShellBar logo | SVG (≤32px tall) | `src/assets/images/sap-logo.svg` | `branding.logo` — Base64 data URI in config |
| Sign-in hero | SVG/PNG (~280px wide) | `co-logo-orchestrating.png` | `branding.heroImage` — Base64 data URI in config |
| Favicon set | ico/svg/png | `public/favicon/*` | Overwrite files in static root |
| Funding logo | PNG | `splash/BMWK-EU.png` | Hidden unless `showFundingLogo` |

SVG logo preferred (crisp in light + Horizon dark themes). Colors elsewhere use `ThemingParameters` — UI5 Horizon theming is the real theming lever; custom CSS is deferred (see Deferred).

---

## Current State Audit

### Already environment-driven — no change

`documentationBaseUrl`, `githubBaseUrl`, `mcp2DocsUrl`, `featureToggles.*` (via `frontend-config.json`); Sentry DSN (client `GET /sentry`, server `BFF_SENTRY_DSN`); Dynatrace RUM (`DYNATRACE_SCRIPT_URL`) + OTLP (`DYNATRACE_OTLP_*`); Matomo (`MATOMO_URL` + `MATOMO_SITE_ID`).

### Hardcoded — must change

| File | Line | Value | Fix |
|---|---|---|---|
| `src/components/Core/ShellBar.tsx` | 77 | `sap-logo.svg` | `branding.logo` (data URI), neutral placeholder fallback |
| `src/components/Core/ShellBar.tsx` | 78 | `'OpenControlPlane UI'` | `branding.appName` |
| `src/spaces/onboarding/pages/SignInPage/SignInPage.tsx` | 38 | `co-logo-orchestrating.png` | `branding.heroImage` (data URI), fallback to bundled OCP image |
| `src/spaces/onboarding/pages/SignInPage/SignInPage.tsx` | 54 | BMWK-EU logo | show only if `branding.showFundingLogo` |
| `src/lib/shared/useLink.ts` | 17 | `https://open-control-plane.io/operators/...` | route through `documentationBaseUrl` |
| `src/views/ProjectList.tsx` | 11 | `https://open-control-plane.io/users/...` | route through `documentationBaseUrl` |
| `src/components/Core/FeedbackButton.tsx` | 158 | `github.com/openmcp-project/...` | `feedbackUrl`, hide button if unset |
| `server/telemetry/bootstrap/opentelemetry-init.ts` | 13 | `'ui-frontend-bff'` | `process.env.OTEL_SERVICE_NAME ?? 'ui-frontend-bff'` |
| `src/locales/en.json` | 3 | `"Welcome to Control Plane UI"` | interpolate `{{appName}}` |
| `src/locales/en.json` | 216-217 | `"Hyperspace Portal"` | interpolate `{{portalName}}` |

**Translation review note:** `MCPHealthPopoverButton.*` uses "MCP" as the *domain* term (Managed Control Plane) — acceptable, leave. "BTP Global Account ID" labels (`en.json:445,468,555,823`) are SAP-specific; hide the `chargingTargetId` field wherever the API does not return it (it is already optional in the type schema) rather than adding config.

---

## Technical Design

### Config shape (`frontend-config.json`)

```json
{
  "landscape": "LOCAL",
  "documentationBaseUrl": "http://localhost:3000",
  "githubBaseUrl": "https://github.com",
  "mcp2DocsUrl": "",
  "feedbackUrl": null,
  "branding": {
    "appName": "Control Plane UI",
    "portalName": "the portal",
    "logo": null,
    "heroImage": null,
    "showFundingLogo": false
  },
  "featureToggles": {
    "markMcpV1asDeprecated": false,
    "enableMcpV2": false,
    "enableHeadlamp": false,
    "showLandscaperCard": false
  }
}
```

**Zod schema (in `FrontendConfigContext.tsx`), all optional with defaults** so existing deployments keep working unchanged:

```ts
// Use z.string() (NOT .url()): data: URIs are not valid per the URL spec,
// so .url() would reject them. z.string() is correct here.
branding: z.object({
  appName:         z.string().default('Control Plane UI'),
  portalName:      z.string().default('the portal'),
  logo:            z.string().nullable().default(null), // data URI: "data:image/svg+xml;base64,…"
  heroImage:       z.string().nullable().default(null), // data URI: "data:image/png;base64,…"
  showFundingLogo: z.boolean().default(false),
}).default({}),
feedbackUrl: z.string().url().nullable().default(null),
```

Alt text derives from `appName` — no separate alt fields.

### Brand assets — inline Base64 data URIs in config

Logo and hero image are stored **directly in `frontend-config.json`** as Base64-encoded data URI strings:

```
"logo":      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0i…"
"heroImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg…"
```

**Why this works here:**
- The CSP already allows `img-src 'self' data:` — no change needed.
- The `<img src={logo}>` attribute accepts data URIs natively.
- Zero extra files, zero file mounts, zero new env vars, zero server changes for assets. One config file contains everything.
- Consistent with `FRONTEND_CONFIG_PATH` — operators already supply one file per environment.

**How to encode:** `base64 -i logo.svg` on Linux/macOS, then prepend `data:image/svg+xml;base64,`. Tools like [base64encode.org](https://www.base64encode.org) work too for one-offs.

**JSON size:** a typical SVG logo encodes to ~1–5 KB; a PNG hero at 280px wide to ~10–30 KB. Acceptable in a config file loaded once per session.

**Fallback:** when `logo` is `null` (or fails), render the neutral `BrandLogoPlaceholder` monogram — never the SAP logo (Legal). Null `heroImage` falls back to the bundled OCP hero.

**Favicons** are a special case — they are referenced in the static `index.html` before JS loads and cannot be data-URI'd from config. Favicon replacement remains a file-level concern: operators drop replacement files into the server's static `/favicon/` directory (same-origin, no code change). This is optional — the default OCP favicons are acceptable for most deployments.

> **No-cache:** `frontend-config.json` must be served with `Cache-Control: no-cache` so a branding update is picked up on the next page load. This applies regardless of the asset mechanism.

### App name in the browser tab — client-side

The client already holds the config in `FrontendConfigContext`. Set `document.title = appName` in an effect. No server-side HTML patching, no second config parser. Cost: a brief default-title flash before JS loads — acceptable for an authenticated internal SPA. (If a correct PWA-install name is ever needed, add a startup `index.html` patch mirroring `injectDynatraceTag` + a dynamic manifest route — deferred, see Deferred.)

### Portal name — i18n interpolation

`NotInLuigiView` strings become `t('...', { portalName })` reading `branding.portalName` (default `"the portal"`). SAP sets `"Hyperspace Portal"`; others set their own or take the neutral default.

---

## Work Breakdown

### Phase 1 — Config + non-visual plumbing (small, low-risk)
1. Extend Zod schema: `branding` + `feedbackUrl` (all optional, defaulted). Use `z.string()` for `logo`/`heroImage` — not `.url()`, which rejects `data:` URIs.
2. Route the two hardcoded doc URLs (`useLink.ts`, `ProjectList.tsx`) through existing `documentationBaseUrl`.
3. `FeedbackButton.tsx`: use `feedbackUrl`; hide the button when unset.
4. OTel service name ← `OTEL_SERVICE_NAME`.
5. `server.ts`: ensure `frontend-config.json` is served `no-cache` (so branding updates propagate on next load).

### Phase 2 — Visible branding
6. `BrandLogoPlaceholder` component (neutral monogram — never SAP).
7. `ShellBar.tsx`: `appName` as title; render `<img src={logo}>` (data URI) with `onError` → placeholder; null `logo` → placeholder.
8. `SignInPage.tsx`: render `<img src={heroImage}>` (data URI); null → bundled OCP image; gate funding logo on `showFundingLogo`.
9. Client: `document.title = appName`.
10. `en.json`: `welcomeMessage` ← `{{appName}}`; `NotInLuigiView` ← `{{portalName}}`.

### Files changed
```
src/context/FrontendConfigContext.tsx          Zod schema (branding.logo / heroImage as z.string())
src/lib/shared/useLink.ts                       2 doc URLs → documentationBaseUrl
src/views/ProjectList.tsx                       URL → useLink
src/components/Core/FeedbackButton.tsx          feedbackUrl, hide if unset
src/components/Core/ShellBar.tsx                logo (data URI) + appName, placeholder fallback
src/components/Core/BrandLogoPlaceholder.tsx    NEW — neutral monogram
src/spaces/.../SignInPage/SignInPage.tsx        heroImage (data URI) + funding flag
src/<app root>                                  set document.title from appName
src/locales/en.json                             interpolate appName / portalName
server/telemetry/bootstrap/opentelemetry-init.ts  OTEL_SERVICE_NAME
server.ts                                       no-cache for frontend-config.json
docs/operator/whitelabel.md                     NEW — operator guide
```
No new server plugins. One new client component. One standard env var (`OTEL_SERVICE_NAME`). **No new env vars for assets — images live in the config file.**

> **Compliance:** new files inherit REUSE/SPDX headers from `REUSE.toml` (`precedence = "closest"`); match neighbors if a directory has explicit per-file headers.

---

## Deferred (explicitly out of this cut, with rationale)

| Deferred | Why | Revisit when |
|---|---|---|
| Runtime translation-override engine | `appName` + `portalName` cover the real product-name pain; a general override loader is a whole subsystem beyond the issue's scope | An org needs to reword arbitrary strings, not just names |
| Server-side `index.html` patch + dynamic `site.webmanifest` | Client-side `document.title` covers the tab; SEO/PWA-install benefit is marginal for an authenticated internal SPA | A correct PWA-install name is a stated requirement |
| `customCssUrl` / custom CSS theme | UI5 Horizon `ThemingParameters` already carries theming; adds surface for little gain | A concrete theming request arrives |
| `appShortName`, separate alt-text fields | No consumer once the manifest is static; alt derives from `appName` | Dynamic manifest is built |

---

## Deployment Reference (→ `docs/operator/whitelabel.md`)

**Minimal (no customization):** ship `frontend-config.json` as today; all branding defaults apply.

**Full whitelabel:**
```
# env — only one branding-related var
OTEL_SERVICE_NAME=acmecorp-cp-ui

# Optional: replace favicons by mounting files at /favicon/ in the static root.
# Logo and hero image go directly into frontend-config.json as Base64 data URIs.
```
```json
{
  "landscape": "LIVE",
  "documentationBaseUrl": "https://docs.acmecorp.com/platform",
  "githubBaseUrl": "https://github.com/acmecorp",
  "feedbackUrl": "https://jira.acmecorp.com/projects/CP/issues/new",
  "branding": {
    "appName": "AcmeCorp Platform",
    "portalName": "Acme Portal",
    "logo": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmci…",
    "heroImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARgAAAC0CAY…",
    "showFundingLogo": false
  },
  "featureToggles": { "markMcpV1asDeprecated": true, "enableMcpV2": true, "enableHeadlamp": false, "showLandscaperCard": false }
}
```

---

## Open Decisions (want a sign-off, have a default to proceed on)

1. **Favicon per org** — worth the operator overhead, or leave the default OCP favicon for all? Default: support override (zero code), document it, don't gate the release on it.
2. **`portalName` default wording** — `"the portal"` so `NotInLuigiView` reads naturally when unset. Confirm with content; proceed on it.
3. **Doc-link path assumption** — routing the two guides through `documentationBaseUrl` assumes an org's docs mirror the OCP path structure (same assumption all existing doc links already make). If an org's paths differ the links 404 — acceptable and consistent; flag if not.

---

## References

- Issue: [openmcp-project/backlog#595](https://github.com/openmcp-project/backlog/issues/595) · Depends on [#514](https://github.com/openmcp-project/backlog/issues/514) · Related [#419](https://github.com/openmcp-project/backlog/issues/419)
- `FrontendConfigContext`: [`src/context/FrontendConfigContext.tsx`](../src/context/FrontendConfigContext.tsx)
- Copy-at-startup pattern: [`server.ts:35-39`](../server.ts#L35-L39) · on-disk HTML patch reference: [`server/telemetry/client-injection/dynatrace.ts`](../server/telemetry/client-injection/dynatrace.ts)
