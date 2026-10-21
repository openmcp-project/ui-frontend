# Whitelabel Solution for ui-frontend — Design Specification

**GitHub Issue:** [#595 — Develop Webapp as a Whitelabel solution](https://github.com/openmcp-project/backlog/issues/595)  
**Status:** Needs Refinement  
**Milestone:** Q4/26

---

## Executive Summary

The ui-frontend must be deployable by any organization running the Open Control Plane stack without forking the repository or patching source code. Customization is achieved purely through runtime configuration — a `frontend-config.json` file and optional brand-asset files mounted into the server — so the same published Docker image can be deployed by any organization under its own identity.

---

## Scope Model & Hard Constraints

Read this before the perspective sections — it bounds every decision below.

### Deployment model: one deployment per organization (not per-request multi-tenancy)

The whole `frontend-config.json` / env-var pattern is resolved **once at startup / page load**, not per request. This spec therefore assumes **one deployment (one running container + one config) per organization**: the same published image is pulled by each org and configured at install time. We are **not** building a single instance that serves many orgs with different branding per HTTP request — that would require per-request config resolution and a tenant-routing layer that does not exist today. If multi-org-per-instance is ever required, it is a separate epic. This assumption is called out because it changes nearly every design choice below.

### Content-Security-Policy constrains where assets may live

The BFF sets a strict CSP in [`server.ts`](../server.ts) (the `onSend` hook):

```
img-src 'self' data:
style-src 'self' 'unsafe-inline'
connect-src 'self' sdk.openui5.org api.iconify.design api.simplesvg.com api.unisvg.com <telemetry origins>
```

Consequences that directly shape the asset strategy:

- **Logos/favicons from an external CDN are blocked by the browser** unless that origin is added to `img-src` per deployment. External image URLs are therefore **not** a viable default.
- **An external custom stylesheet (`<link href="https://…">`) is blocked** by `style-src 'self'`. The stretch CSS-theming goal must serve CSS same-origin or be dropped.
- **Viable without touching CSP:** same-origin assets (`/brand/logo.svg`) and `data:` URIs. These are the two sanctioned mechanisms.

Any approach that relies on a third-party origin must also extend the CSP, and that extension must be per-deployment config — not a blanket relaxation.

### Standalone vs. embedded (Hyperspace Portal / Luigi) mode

The app already runs in **two modes**, and whitelabel must decide which it covers:

1. **Standalone** — served directly, user hits the sign-in page.
2. **Embedded in SAP Hyperspace Portal (Luigi micro-frontend)** — driven by `HYPERSPACE_PORTAL_CONFIG_PATH` + `hyperspace-portal-config.json` ([`server.ts:41-51`](../server.ts#L41-L51)), consumed by `NotInLuigiView`, `useLuigiNavigate`, `ProjectChooser`, `ProjectsList`.

"Hyperspace Portal" in the translations is **not stray branding** — it names this real integration. `NotInLuigiView` is the error shown when the app expects to be embedded but isn't.

**Decision:** whitelabel **covers the embedded mode too**, and the portal name is driven by the **same `frontend-config.json` branding config** as everything else — no separate branding mechanism. Concretely:

- Add `branding.portalName` (string, default `"the portal"`). The `NotInLuigiView` strings become interpolated: `t('NotInLuigiView.titleMessage', { portalName })` → *"Opened outside of {{portalName}}"*. SAP sets `portalName: "Hyperspace Portal"`; AcmeCorp sets `portalName: "Acme Portal"`; an org that doesn't embed gets the neutral default.
- The functional Luigi runtime config (`HYPERSPACE_PORTAL_CONFIG_PATH` / `hyperspace-portal-config.json`) is a **separate concern** — it configures the micro-frontend integration (navigation/context), not branding, and stays as-is. Only the user-visible *naming* moves into `branding`.
- Rationale: one config surface for all customization (the user's explicit requirement). An operator touches exactly one file + one asset directory; there is no "SAP-internal" carve-out to reason about.

---

## Perspectives

### 1. Product Manager / Business Analyst

**Goal:** Enable wider adoption by making the product truly organization-agnostic. Organizations currently avoid adopting the UI because it ships with SAP-specific branding that would confuse their users.

**Value delivered:**
- Any organization can deploy the app under their own name and visual identity without maintaining a fork.
- A single container image serves all organizations; no per-org CI pipelines or rebuilds.
- Future features (new feature toggles, new observability connectors) automatically propagate to all deployments.

**Acceptance criteria (from issue scope):**

| # | Item | Notes |
|---|---|---|
| AC-1 | App name is configurable | Shown in browser tab, PWA manifest, ShellBar header |
| AC-2 | Logos & favicon are replaceable | ShellBar logo, sign-in hero image, all favicon formats |
| AC-3 | Documentation/enablement links are fully configurable | No hardcoded `open-control-plane.io` URLs remain |
| AC-4 | Feedback link is configurable | Points to the org's own issue tracker |
| AC-5 | Observability tooling is configurable | Sentry, Dynatrace, Matomo — all already env-var driven (see §4) |
| AC-6 | Translations contain no hardcoded product/portal names | "Hyperspace Portal", "MCP" labels, "BTP" labels reviewed |
| AC-7 | OTel service name is configurable | Currently hardcoded as `'ui-frontend-bff'` |
| AC-8 | Sign-in funding logo is opt-in | BMWK/EU logo should not appear in non-SAP deployments |
| AC-9 (stretch) | Custom CSS theme | Organizations supply CSS variable overrides |

**Out of scope for this epic:**
- Per-user personalization.
- Multiple languages beyond `en.json`.
- Component-level feature gating beyond existing `featureToggles`.

---

### 2. UX Designer

**User mental model:** A platform engineer at "AcmeCorp" opens the app and expects to see "AcmeCorp Platform" in the browser tab and a familiar logo — not "SAP" and an SAP logo that they have no permission to use.

**Brand-sensitive surfaces (in user journey order):**

1. **Browser tab / bookmarks** — `<title>` tag (`index.html`), PWA `site.webmanifest`
2. **Sign-in page** — hero image (currently `co-logo-orchestrating.png`, alt text "Open Control Plane"), welcome message in translations, funding disclaimer logo (SAP/BMWK/EU)
3. **Application shell** — ShellBar brand logo (SAP SVG, top-left), ShellBar primary title (fallback `'OpenControlPlane UI'`)
4. **Error page** — `NotInLuigiView` component references "Hyperspace Portal" (SAP's Luigi micro-frontend portal product); must use a generic term or be configurable
5. **Forms** — "BTP Global Account ID" labels are SAP-specific; in a generic deployment these may not apply or may need a different label
6. **Links** — "Learn more" on Projects page, Identity Provider guide, Feedback "click here" → all open SAP-hosted documentation

**UX requirements:**
- If no custom logo is provided, a neutral SVG placeholder (e.g. a monogram from the app name) is shown — **never the SAP logo** (see Legal below). A broken image tag is never acceptable; assets that fail to load fall back to the placeholder.
- App name in the ShellBar and in the browser tab must always be in sync (both driven from the same config field).
- The funding disclaimer logo (`BMWK/EU`) must be hidden unless explicitly enabled — it only makes sense for the SAP-funded OSS deployment.
- "Hyperspace Portal" → see the Scope Model decision: when not embedded in Luigi these strings/guards should be neutralized or hidden, not merely reworded.

> **Legal / trademark (hard requirement, not a preference):** the SAP logo (`sap-logo.svg`) and the BMWK/EU funding logo carry specific usage rights. A third-party deployment must **not** ship or fall back to the SAP logo, and the funding logo must default to hidden. This rules out "fall back to the bundled SAP logo when `logoUrl` is null" — the null-logo fallback must be a brand-neutral placeholder.

---

### 3. Graphic Designer

**Asset requirements per whitelabel deployment:**

| Asset | Format | Current default | Config mechanism |
|---|---|---|---|
| ShellBar brand logo | SVG (recommended) or PNG | `src/assets/images/sap-logo.svg` | `branding.logoUrl` in config |
| Sign-in hero image | PNG or SVG | `src/assets/images/co-logo-orchestrating.png` | `branding.heroImageUrl` in config |
| Favicon (ICO) | `.ico` | `public/favicon/favicon.ico` | Brand assets directory (see §5) |
| Favicon (SVG) | `.svg` | `public/favicon/favicon.svg` | Brand assets directory |
| Favicon PNG 96px | `.png` | `public/favicon/favicon-96x96.png` | Brand assets directory |
| Apple touch icon | `.png` 180px | `public/favicon/apple-touch-icon.png` | Brand assets directory |
| PWA icon 192px | `.png` | `public/favicon/web-app-manifest-192x192.png` | Brand assets directory |
| PWA icon 512px | `.png` | `public/favicon/web-app-manifest-512x512.png` | Brand assets directory |
| Funding logo | `.png` | `src/assets/images/splash/BMWK-EU.png` | Hidden unless `branding.showFundingLogo: true` |

**Design guidelines for replacement assets:**
- ShellBar logo: max height 32px; SVG preferred for crisp rendering in both light and dark Horizon themes.
- Hero image: displayed at ~280px wide on the sign-in page; PNG with transparent background or SVG works best.
- Favicons: the existing files match the standard W3C web-app-manifest spec; provide the same set.

**Stretch — CSS theming:**
- All color values in this project use `ThemingParameters` from `@ui5/webcomponents-react-base`, so the UI5 Horizon theme is the primary theming mechanism.
- An organization could supply a custom UI5 theme via `@ui5/theming` build pipeline, but this is complex.
- A simpler stretch goal: inject a custom CSS file via `branding.customCssUrl`. **CSP caveat:** `style-src 'self' 'unsafe-inline'` blocks an external `<link href="https://…">`, so the CSS must be served **same-origin** — i.e. mounted into the `/brand/` directory (e.g. `/brand/theme.css`), not loaded from a CDN. An external stylesheet would require extending `style-src` per deployment.

---

### 4. Frontend Developer — Current State Audit

#### 4.1 What is already environment-driven (no changes needed)

| Feature | Mechanism |
|---|---|
| Documentation base URL | `frontend-config.json` → `documentationBaseUrl` |
| GitHub base URL | `frontend-config.json` → `githubBaseUrl` |
| MCP v2 docs URL | `frontend-config.json` → `mcp2DocsUrl` |
| Feature toggles | `frontend-config.json` → `featureToggles.*` |
| Sentry DSN (client) | BFF endpoint `GET /sentry` → reads `FRONTEND_SENTRY_DSN` env var |
| Sentry DSN (server) | `BFF_SENTRY_DSN` env var |
| Dynatrace RUM | `DYNATRACE_SCRIPT_URL` env var → injected into `index.html` at startup |
| Dynatrace OTLP | `DYNATRACE_OTLP_ENDPOINT` + `DYNATRACE_OTLP_TOKEN` env vars |
| Matomo | `MATOMO_URL` + `MATOMO_SITE_ID` env vars |

#### 4.2 Hardcoded items that must be made configurable

| File | Line | Hardcoded value | Fix |
|---|---|---|---|
| `index.html` | 10, 14 | `"Control Plane UI"` (title + apple-meta) | Read from config at server startup or template substitution |
| `public/favicon/site.webmanifest` | 2, 3 | `"Control Plane UI"` / `"CP UI"` | Template + server substitution |
| `src/components/Core/ShellBar.tsx` | 77 | `sap-logo.svg` | Use `branding.logoUrl` from context; fallback to default |
| `src/components/Core/ShellBar.tsx` | 78 | `'OpenControlPlane UI'` | Use `branding.appName` from context |
| `src/spaces/onboarding/pages/SignInPage/SignInPage.tsx` | 38 | `co-logo-orchestrating.png` | Use `branding.heroImageUrl` from context; fallback |
| `src/spaces/onboarding/pages/SignInPage/SignInPage.tsx` | 54 | BMWK-EU logo | Show only if `branding.showFundingLogo === true` |
| `src/lib/shared/useLink.ts` | 17 | `https://open-control-plane.io/operators/...` | Move to `links.identityProviderGuideUrl` in config, fallback to `${documentationBaseUrl}/...` |
| `src/views/ProjectList.tsx` | 11 | `https://open-control-plane.io/users/...` | Move to `links.projectsLearnMoreUrl` in config, fallback to `${documentationBaseUrl}/...` |
| `src/components/Core/FeedbackButton.tsx` | 158 | `https://github.com/openmcp-project/ui-frontend/issues/new/choose` | Move to `links.feedbackUrl` in config; hide feedback button if null |
| `server/telemetry/bootstrap/opentelemetry-init.ts` | 13 | `'ui-frontend-bff'` | Read from `OTEL_SERVICE_NAME` env var with fallback |
| `src/locales/en.json` | 3 | `"Welcome to Control Plane UI"` | Use translation key; provide override mechanism |
| `src/locales/en.json` | 216-217 | `"Hyperspace Portal"` | Interpolate `{{portalName}}` from `branding.portalName` (not a hardcoded rename) |

#### 4.3 Translation keys that need product-name review

These are in `src/locales/en.json` and contain terms that are SAP-specific or too product-specific for a generic deployment:

| Key | Current value | Recommendation |
|---|---|---|
| `SignInPage.welcomeMessage` | `"Welcome to Control Plane UI"` | Make generic: `"Welcome"` or drive `"Control Plane UI"` from `branding.appName` |
| `NotInLuigiView.titleMessage` | `"Opened outside of Hyperspace Portal"` | Reword to `"Opened outside of {{portalName}}"`, interpolate `branding.portalName` |
| `NotInLuigiView.subtitleMessage` | `"...inside of the Hyperspace Portal..."` | Same — interpolate `{{portalName}}` |
| `MCPHealthPopoverButton.supportTicketTitle*` | `"MCP Ready"`, `"MCP Not Ready"`, etc. | "MCP" here is the domain concept — acceptable, but could be made dynamic if the resource kind is ever renamed |
| `common.btp` | `"BTP"` | Keep but ensure "BTP Global Account ID" form fields are not shown in non-SAP deployments (this may already be gated by data availability) |

---

### 5. Technical Architecture — Recommended Implementation

#### 5.1 Extend `frontend-config.json`

```json
{
  "landscape": "LOCAL",
  "documentationBaseUrl": "http://localhost:3000",
  "githubBaseUrl": "https://github.com",
  "mcp2DocsUrl": "",
  "branding": {
    "appName": "Control Plane UI",
    "appShortName": "CP UI",
    "portalName": "the portal",
    "logoUrl": null,
    "logoAlt": "Control Plane UI",
    "heroImageUrl": null,
    "heroImageAlt": "Control Plane",
    "showFundingLogo": false,
    "customCssUrl": null
  },
  "links": {
    "feedbackUrl": null,
    "identityProviderGuideUrl": null,
    "projectsLearnMoreUrl": null
  },
  "featureToggles": {
    "markMcpV1asDeprecated": false,
    "enableMcpV2": false,
    "enableHeadlamp": false,
    "showLandscaperCard": false
  }
}
```

**Zod schema additions** (in `src/context/FrontendConfigContext.tsx`):
```ts
// NOTE: do NOT use z.string().url() for asset fields — it rejects the
// same-origin relative paths ("/brand/logo.svg") and data: URIs that the
// CSP actually permits. Plain z.string() is correct here. Link fields
// (which really are absolute URLs) may use .url().
const brandingSchema = z.object({
  appName: z.string().default('Control Plane UI'),
  appShortName: z.string().default('CP UI'),
  portalName: z.string().default('the portal'),      // interpolated into NotInLuigiView strings
  logoUrl: z.string().nullable().default(null),       // "/brand/logo.svg" or data: URI
  logoAlt: z.string().default('Control Plane UI'),
  heroImageUrl: z.string().nullable().default(null),  // "/brand/hero.png" or data: URI
  heroImageAlt: z.string().default('Control Plane'),
  showFundingLogo: z.boolean().default(false),
  customCssUrl: z.string().nullable().default(null),  // must be same-origin (CSP)
}).default({});

const linksSchema = z.object({
  feedbackUrl: z.string().url().nullable().default(null),
  identityProviderGuideUrl: z.string().url().nullable().default(null),
  projectsLearnMoreUrl: z.string().url().nullable().default(null),
}).default({});
```

All fields are optional with sensible defaults so existing deployments that don't specify `branding` or `links` continue to work unchanged.

#### 5.2 Brand asset files strategy

> **CSP constraint (see Scope Model):** `img-src 'self' data:`. Only **same-origin** assets and **`data:` URIs** render without editing the CSP. External CDN URLs are not a viable default.

Config fields hold a **reference** to an asset (a same-origin path or a `data:` URI) — never the image bytes themselves. The bytes are supplied by the operator as files, exactly mirroring how `frontend-config.json` is already supplied via `FRONTEND_CONFIG_PATH` ([`server.ts:35-39`](../server.ts#L35-L39)).

**Primary mechanism — same-origin `/brand/` directory:**
The BFF serves a `/brand/` static directory from a path defined by the `BRAND_ASSETS_DIR` env var; config points at it with a relative path.

```
# In deployment (e.g. Helm values / k8s env):
BRAND_ASSETS_DIR=/config/brand

# Volume mounted at /config/brand:
#   logo.svg
#   hero.png

# frontend-config.json:
{
  "branding": {
    "logoUrl": "/brand/logo.svg",
    "heroImageUrl": "/brand/hero.png"
  }
}
```

**Alternative — `data:` URI inline in config:**
For very small assets (a simple favicon or monogram logo), `logoUrl: "data:image/svg+xml;base64,…"` works with no extra files because the CSP allows `data:`. Not recommended for the full favicon set — it bloats the JSON and is hard to maintain.

**External CDN — only with explicit CSP extension:**
If an operator insists on a CDN, they must also add the origin to `img-src` via a new per-deployment env var (e.g. `BRAND_ASSET_ORIGINS`, folded into the `onSend` CSP builder alongside the existing telemetry origins). This is an opt-in escape hatch, not the default path.

**Favicons — volume-mount directory:**
Favicons are referenced directly in `index.html` with fixed paths (`/favicon/...`). Rather than adding dynamic logic to `index.html`, allow operators to mount a custom favicon directory and have the BFF serve it at `/favicon/` ahead of the built-in defaults. Controlled by `BRAND_FAVICON_DIR` env var. (These are same-origin, so CSP is satisfied.)

**Server changes (BFF):**
```ts
// server.ts — register BEFORE @fastify/vite so these prefixes win over the
// built-in static defaults. Guarded so default deployments are unaffected.
if (process.env.BRAND_ASSETS_DIR) {
  await fastify.register(fastifyStatic, {
    root: process.env.BRAND_ASSETS_DIR,
    prefix: '/brand/',
    decorateReply: false,
  });
}
if (process.env.BRAND_FAVICON_DIR) {
  await fastify.register(fastifyStatic, {
    root: process.env.BRAND_FAVICON_DIR,
    prefix: '/favicon/',
    decorateReply: false,
  });
}
```

> **Caching:** brand assets and `frontend-config.json` must be served with `Cache-Control: no-cache` (or a short max-age), otherwise a branding change won't propagate to already-cached clients. Note the existing `@fastify/vite` static config applies `maxAge: 1y, immutable` only to content-hashed `/assets/` — the new `/brand/` prefix and the config file must be excluded from that aggressive caching.

> **Graceful fallback:** if a referenced asset 404s (operator typo, missing mount) the UI must degrade to the neutral placeholder — never a broken `<img>`. Handle via `onError` on the `<img>` element in `ShellBar`/`SignInPage`.

#### 5.3 App name in `index.html` and `site.webmanifest`

`index.html`, `site.webmanifest` and the favicon links are static artifacts baked into the image. The app name must reach the browser tab and PWA manifest. Two approaches, with a real tradeoff:

**Approach A — server-side patch at startup (SEO-correct, no flash).**
Follow the **existing on-disk pattern** used by [`injectDynatraceTag`](../server/telemetry/client-injection/dynatrace.ts) and `injectMatomoTag`: at boot, read `dist/client/index.html` from disk, string-replace, and `writeFileSync` it back — *not* an in-memory patch.

```ts
// server/plugins/index-html-branding.ts — mirrors dynatrace.ts
const indexPath = join(process.cwd(), 'dist/client/index.html');
let html = readFileSync(indexPath, 'utf-8');
html = html
  .replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(appName)}</title>`)
  .replace(/(apple-mobile-web-app-title"\s+content=")[^"]*(")/i, `$1${escapeHtml(appName)}$2`);
writeFileSync(indexPath, html, 'utf-8');
```

> **New responsibility — the BFF does not parse `frontend-config.json` today.** The config currently has exactly one consumer: the client (`fetch('/frontend-config.json')` in `FrontendConfigContext.tsx`). Approach A makes the **server** a second consumer, so `appName` must be read server-side. Options: (a) read the same JSON file the server already copies via `FRONTEND_CONFIG_PATH` and share the Zod schema between client and server (the server is TS too), or (b) expose `appName` as its own env var (`BRAND_APP_NAME`) to avoid a second config parser entirely. Option (b) is simpler and keeps the single-parser invariant; option (a) keeps everything in one config file. Pick one explicitly.

`site.webmanifest` is then served as a dynamic BFF route returning JSON with `name`/`short_name` from the same source.

**Approach B — client-side (simpler, no server changes).**
The client already holds the full config in `FrontendConfigContext`. Setting `document.title = appName` in an effect, and swapping the favicon `<link>` in the DOM, needs **zero server changes** and no second config parser. Cost: a brief flash of the default title before JS loads, and the raw HTML `<title>` (what a crawler or no-JS client sees) stays the default. For an authenticated internal SPA behind a login this is usually acceptable.

**Recommendation:** start with **Approach B** for `document.title` (cheapest, respects the single-parser invariant), and only add Approach A's manifest route if a correct PWA install name is required. Decide per the PWA-install requirement.

#### 5.4 OTel service name

Replace the hardcoded string in `server/telemetry/bootstrap/opentelemetry-init.ts`:
```ts
- serviceName: 'ui-frontend-bff',
+ serviceName: process.env.OTEL_SERVICE_NAME ?? 'ui-frontend-bff',
```
`OTEL_SERVICE_NAME` is also a standard OpenTelemetry environment variable, so this aligns with the OTel spec.

#### 5.5 Translation override mechanism

To allow organizations to override translation strings (e.g., "Hyperspace Portal" → "Confluence" or simply "your portal"), the i18n init in `src/utils/i18n/i18n.ts` can load an optional `/brand/translations/en.json` from the server and deep-merge it over the built-in translations:

```ts
const resources: { en: { translation: Record<string, unknown> } } = {
  en: { translation: enTranslations },
};

// Load org overrides at runtime if available
try {
  const overrides = await fetch('/brand/translations/en.json');
  if (overrides.ok) {
    const json = await overrides.json();
    merge(resources.en.translation, json); // deep merge
  }
} catch {
  // no overrides — use defaults
}
```

The override file only needs to contain the keys that differ. Example:
```json
{
  "SignInPage": {
    "welcomeMessage": "Welcome to AcmeCorp Platform"
  },
  "SupportInfo": {
    "serviceIdsTooltip": "Service IDs, provider names, …"
  }
}
```

> The **portal name** is *not* overridden here — it comes from `branding.portalName` and is interpolated into the `NotInLuigiView` strings. Translation overrides are for arbitrary wording changes beyond what structured config fields cover; portal/app names stay in `branding` so they are set in one place.

This approach avoids hardcoding any specific product name in the default translations while giving operators full control.

---

### 6. Deployment Configuration Reference

This section is the operator-facing reference that belongs in `docs/operator/`.

#### Minimal deployment (no customization)
Just provide a `frontend-config.json` as today. All branding fields default to the built-in Open Control Plane assets.

#### Full whitelabel deployment example

**Environment variables (BFF):**
```
BRAND_ASSETS_DIR=/etc/brand/assets
BRAND_FAVICON_DIR=/etc/brand/favicon
OTEL_SERVICE_NAME=acmecorp-cp-ui
```

**Mounted files at `/etc/brand/`:**
```
assets/
  logo.svg              → ShellBar brand logo
  hero.png              → Sign-in page hero image
  translations/
    en.json             → Translation overrides
favicon/
  favicon.ico
  favicon.svg
  favicon-96x96.png
  apple-touch-icon.png
  web-app-manifest-192x192.png
  web-app-manifest-512x512.png
  site.webmanifest      ← NOT needed here (generated dynamically)
```

**`frontend-config.json`:**
```json
{
  "landscape": "LIVE",
  "documentationBaseUrl": "https://docs.acmecorp.com/platform",
  "githubBaseUrl": "https://github.com/acmecorp",
  "mcp2DocsUrl": "https://docs.acmecorp.com/platform/v2",
  "branding": {
    "appName": "AcmeCorp Platform",
    "appShortName": "ACP",
    "portalName": "Acme Portal",
    "logoUrl": "/brand/logo.svg",
    "logoAlt": "AcmeCorp",
    "heroImageUrl": "/brand/hero.png",
    "heroImageAlt": "AcmeCorp Platform",
    "showFundingLogo": false
  },
  "links": {
    "feedbackUrl": "https://jira.acmecorp.com/projects/CP/issues/new",
    "identityProviderGuideUrl": "https://docs.acmecorp.com/platform/identity",
    "projectsLearnMoreUrl": "https://docs.acmecorp.com/platform/projects"
  },
  "featureToggles": {
    "markMcpV1asDeprecated": true,
    "enableMcpV2": true,
    "enableHeadlamp": false,
    "showLandscaperCard": false
  }
}
```

---

## Implementation Work Breakdown

### Phase 1 — Configuration foundation (no UI changes)
1. Extend Zod schema in `FrontendConfigContext.tsx` with `branding` and `links` sections (all optional, with defaults). Use `z.string()` (not `.url()`) for asset paths so relative/`data:` values pass.
2. Fix 3 hardcoded documentation URLs in `useLink.ts` and `ProjectList.tsx` — route through config, fallback to `${documentationBaseUrl}/...`.
3. Fix hardcoded feedback URL in `FeedbackButton.tsx` — hide button if `links.feedbackUrl` is null.
4. Fix OTel service name — read `OTEL_SERVICE_NAME` env var.
5. Add BFF static file handler for `BRAND_ASSETS_DIR` at `/brand/` prefix (registered before `@fastify/vite`; excluded from the 1y immutable caching).
6. Add BFF static file handler for `BRAND_FAVICON_DIR` at `/favicon/` prefix.
7. Ensure `frontend-config.json` and `/brand/*` are served `no-cache` so branding changes propagate.

### Phase 2 — Branding in app shell
8. `ShellBar.tsx`: read logo URL and alt text from `FrontendConfigContext`; render `<img src={logoUrl} />` with `onError` → **neutral placeholder** when `logoUrl` is null or fails to load. **Must not fall back to the SAP logo** (legal).
9. `ShellBar.tsx`: read `branding.appName` for `primaryTitle` fallback.
10. `SignInPage.tsx`: read `branding.heroImageUrl` (placeholder fallback, not SAP) and gate the funding logo behind `branding.showFundingLogo`.
11. Build the neutral monogram/placeholder SVG component used by steps 8 and 10.

### Phase 3 — App name in HTML head
12. Decide title mechanism: **Approach B** (client-side `document.title`) first; add **Approach A** (startup on-disk patch of `index.html`, mirroring `dynatrace.ts`) + dynamic `site.webmanifest` route only if a correct PWA-install name is required. If Approach A is chosen, resolve the config-source question (shared Zod schema vs. `BRAND_APP_NAME` env var).

### Phase 4 — Translation overrides & portal naming
13. `src/utils/i18n/i18n.ts`: fetch `/brand/translations/en.json` at init and deep-merge if present.
14. Audit `en.json`: make `SignInPage.welcomeMessage` pull `appName` dynamically; convert the `NotInLuigiView` strings to interpolate `{{portalName}}` from `branding.portalName` (default `"the portal"`).

### Phase 5 (Stretch — deferred) — Custom CSS
15. **Deferred per Decision #6.** If later demanded: inject `<link rel="stylesheet" href="${branding.customCssUrl}" />`, **same-origin only** (served from `/brand/`); document the CSP constraint. Default first cut documents the `@ui5/theming` route instead.

---

## Decisions & Recommendations

These were open questions; each now carries a recommended resolution. Flagged items still want a product/UX sign-off but have a default to proceed on.

1. **Luigi / Hyperspace Portal scope — DECIDED.** Whitelabel covers the embedded mode, driven by the same `frontend-config.json` via `branding.portalName` (see Scope Model). The functional Luigi runtime config stays separate. No "SAP-internal" carve-out.

2. **Title mechanism — RECOMMEND Approach B (client-side `document.title`).** Keeps the single-config-parser invariant (server does not become a second consumer of the config), costs only a brief default-title flash on an authenticated internal SPA. Keep `site.webmanifest` static and generic for now. Only escalate to Approach A (startup on-disk patch + dynamic manifest) if a correct PWA-install name turns out to be a real requirement — treat that as a follow-up, not part of the first cut.

3. **`NotInLuigiView` default wording — RECOMMEND `"the portal"`** as the `branding.portalName` default, so the sentence reads naturally ("Opened outside of the portal") when unset. SAP overrides it to `"Hyperspace Portal"`. Confirm the exact default phrasing with UX/content, but proceed on `"the portal"`.

4. **"BTP Global Account ID" labels — RECOMMEND gating on data, not a new flag.** Hide the `chargingTargetId` field wherever the API does not return it (it is already optional in the type schema), rather than inventing a config toggle. If an org needs a different label for a field that *is* present, that is covered by the translation-override mechanism — no bespoke config. Verify the field is genuinely optional server-side before relying on this.

5. **Hero image — RECOMMEND a single URL, no `<picture>`.** One `heroImageUrl` is sufficient; responsive sources are over-engineering for a sign-in hero. Operators supply an appropriately sized asset. Revisit only if a concrete retina/mobile complaint appears.

6. **Custom CSS (stretch) — RECOMMEND defer.** Given the CSP same-origin constraint and the fact that UI5 Horizon theming (via `ThemingParameters`) already carries the real theming weight, a `customCssUrl` escape hatch adds surface area for little gain. Document the `@ui5/theming` route in the operator guide and drop `customCssUrl` from the first cut; reintroduce only on explicit demand, same-origin and `<link>`-only.

---

## Files Changed (expected scope)

```
frontend-config.json                                  (template + docs update)
src/context/FrontendConfigContext.tsx                 (Zod schema extension — z.string(), not .url(), for assets)
src/lib/shared/useLink.ts                             (move 2 hardcoded URLs to config)
src/views/ProjectList.tsx                             (move hardcoded URL to useLink)
src/components/Core/FeedbackButton.tsx                (configurable URL, hide if null)
src/components/Core/ShellBar.tsx                      (logo + appName from config, neutral fallback)
src/components/Core/BrandLogoPlaceholder.tsx          (new: neutral monogram fallback — NOT SAP logo)
src/spaces/onboarding/pages/SignInPage/SignInPage.tsx (hero image + funding logo flag)
src/locales/en.json                                   (fix hardcoded product names; Luigi strings per scope)
src/utils/i18n/i18n.ts                               (translation override loader)
server/telemetry/bootstrap/opentelemetry-init.ts      (OTEL_SERVICE_NAME env var)
server.ts                                             (register brand static handlers; optional BRAND_ASSET_ORIGINS in CSP builder; no-cache for config/brand)
server/plugins/brand-assets.ts                        (new: static handler for /brand/ and /favicon/)
server/plugins/webmanifest.ts                         (new: dynamic site.webmanifest — only if Approach A chosen)
server/plugins/index-html-branding.ts                 (new: on-disk index.html patch — only if Approach A chosen)
docs/operator/whitelabel.md                           (new operator guide)
```

> **Compliance:** every new source file needs a REUSE/SPDX header. The repo default in `REUSE.toml` covers most paths automatically (`precedence = "closest"`); if a new file lands in a directory with explicit per-file headers, match the neighbors. New placeholder image assets go under the normal asset paths; any third-party asset would go under `LICENSES/`.

---

## References

- GitHub issue: [openmcp-project/backlog#595](https://github.com/openmcp-project/backlog/issues/595)
- Depends on: [Epic #514 — Enable PlatformService contributions](https://github.com/openmcp-project/backlog/issues/514)
- Related: [Epic #419 — UI as a PlatformService](https://github.com/openmcp-project/backlog/issues/419)
- `FrontendConfigContext`: `src/context/FrontendConfigContext.tsx`
- `useLink`: `src/lib/shared/useLink.ts`
- Brand asset injection pattern: `server/telemetry/client-injection/dynatrace.ts` (reference for index.html patching approach)
