# Whitelabel Solution for ui-frontend — Design Specification

**GitHub Issue:** [#595 — Develop Webapp as a Whitelabel solution](https://github.com/openmcp-project/backlog/issues/595)  
**Status:** Needs Refinement  
**Milestone:** Q4/26

---

## Executive Summary

The ui-frontend must be deployable by any organization running the Open Control Plane stack without forking the repository or patching source code. Customization is achieved purely through runtime configuration — a `frontend-config.json` file and optional brand-asset files mounted into the server — so the same Docker image can serve multiple tenants with different identities.

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
- If no custom logo is provided, a reasonable SVG placeholder (e.g. a monogram from the app name) is preferred over a broken image tag.
- App name in the ShellBar and in the browser tab must always be in sync (both driven from the same config field).
- The funding disclaimer logo (`BMWK/EU`) must be hidden unless explicitly enabled — it only makes sense for the SAP-funded OSS deployment.
- "Hyperspace Portal" → use a generic `i18n` key that defaults to a neutral term; organizations can override via translation customization.

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
- A simpler stretch goal: allow injection of a custom CSS file via `branding.customCssUrl` in config, applied as a `<link>` tag before the app bundle.

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
| `src/locales/en.json` | 216-217 | `"Hyperspace Portal"` | Replace with generic term; provide override mechanism |

#### 4.3 Translation keys that need product-name review

These are in `src/locales/en.json` and contain terms that are SAP-specific or too product-specific for a generic deployment:

| Key | Current value | Recommendation |
|---|---|---|
| `SignInPage.welcomeMessage` | `"Welcome to Control Plane UI"` | Make generic: `"Welcome"` or drive `"Control Plane UI"` from `branding.appName` |
| `NotInLuigiView.titleMessage` | `"Opened outside of Hyperspace Portal"` | Replace "Hyperspace Portal" with generic `"your portal"` or make configurable |
| `NotInLuigiView.subtitleMessage` | `"...inside of the Hyperspace Portal..."` | Same as above |
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
const brandingSchema = z.object({
  appName: z.string().default('Control Plane UI'),
  appShortName: z.string().default('CP UI'),
  logoUrl: z.string().url().nullable().default(null),
  logoAlt: z.string().default('Control Plane UI'),
  heroImageUrl: z.string().url().nullable().default(null),
  heroImageAlt: z.string().default('Control Plane'),
  showFundingLogo: z.boolean().default(false),
  customCssUrl: z.string().url().nullable().default(null),
}).default({});

const linksSchema = z.object({
  feedbackUrl: z.string().url().nullable().default(null),
  identityProviderGuideUrl: z.string().url().nullable().default(null),
  projectsLearnMoreUrl: z.string().url().nullable().default(null),
}).default({});
```

All fields are optional with sensible defaults so existing deployments that don't specify `branding` or `links` continue to work unchanged.

#### 5.2 Brand asset files strategy

Two complementary mechanisms for images/favicons:

**Option A — URL references in config (preferred for logos):**
`branding.logoUrl` and `branding.heroImageUrl` accept any URL. Organizations can host their assets on a CDN or point them at files served by the same app (e.g. `/brand/logo.svg`). The BFF serves a `/brand/` static directory from a path defined by the `BRAND_ASSETS_DIR` env var.

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

**Option B — Volume-mount favicon directory (for favicons):**
Favicons are referenced directly in `index.html` with fixed paths (`/favicon/...`). Rather than adding dynamic logic to `index.html`, allow operators to mount a custom favicon directory at `/brand/favicon/` and configure the BFF to serve it at `/favicon/` instead of the built-in defaults. Controlled by `BRAND_FAVICON_DIR` env var.

**Server changes (BFF):**
```ts
// server.ts — add after existing static file setup
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

#### 5.3 App name in `index.html` and `site.webmanifest`

`index.html` and `site.webmanifest` are static files that ship in the Docker image. To inject `branding.appName` into them at startup, the BFF reads `frontend-config.json` at boot and performs a one-time string replace on the in-memory `index.html` before it starts serving:

```ts
// server/plugins/index-html-branding.ts
const config = await loadFrontendConfig(); // same Zod parse as client does
const appName = config.branding?.appName ?? 'Control Plane UI';

// Patch index.html (already in memory after Vite build)
indexHtml = indexHtml
  .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(appName)}</title>`)
  .replace(/apple-mobile-web-app-title" content="[^"]*"/, 
           `apple-mobile-web-app-title" content="${escapeHtml(appName)}"`);
```

`site.webmanifest` is served as a dynamic route that returns the JSON with `name` and `short_name` injected from config.

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
  "NotInLuigiView": {
    "titleMessage": "Opened outside of your portal",
    "subtitleMessage": "Please access this application from inside your portal."
  },
  "SignInPage": {
    "welcomeMessage": "Welcome to AcmeCorp Platform"
  }
}
```

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
1. Extend Zod schema in `FrontendConfigContext.tsx` with `branding` and `links` sections (all optional, with defaults).
2. Fix 3 hardcoded documentation URLs in `useLink.ts` and `ProjectList.tsx` — route through config, fallback to `${documentationBaseUrl}/...`.
3. Fix hardcoded feedback URL in `FeedbackButton.tsx` — hide button if `links.feedbackUrl` is null.
4. Fix OTel service name — read `OTEL_SERVICE_NAME` env var.
5. Add BFF static file handler for `BRAND_ASSETS_DIR` at `/brand/` prefix.
6. Add BFF static file handler for `BRAND_FAVICON_DIR` at `/favicon/` prefix.

### Phase 2 — Branding in app shell
7. `ShellBar.tsx`: read logo URL and alt text from `FrontendConfigContext`; render `<img src={logoUrl} />` with fallback to bundled SAP logo when `logoUrl` is null.
8. `ShellBar.tsx`: read `branding.appName` for `primaryTitle` fallback.
9. `SignInPage.tsx`: read `branding.heroImageUrl` (fallback to bundled logo) and `branding.showFundingLogo`.

### Phase 3 — App name in HTML head
10. BFF Fastify plugin: patch `index.html` at startup with `branding.appName`.
11. BFF: serve `site.webmanifest` dynamically with `branding.appName` and `branding.appShortName`.

### Phase 4 — Translation overrides
12. `src/utils/i18n/i18n.ts`: fetch `/brand/translations/en.json` at init and deep-merge if present.
13. Audit `en.json`: replace "Hyperspace Portal" with a generic default; ensure "Welcome to Control Plane UI" pulls appName dynamically.

### Phase 5 (Stretch) — Custom CSS
14. `index.html` / `mount.ts`: inject `<link rel="stylesheet" href="${branding.customCssUrl}" />` if configured.

---

## Open Questions

1. **Default logo when `logoUrl` is null:** Should the fallback be the existing SAP logo (fine for SAP deployments, confusing for others) or a neutral SVG placeholder generated from `branding.appName`? Recommendation: use a neutral placeholder for non-null appName + null logoUrl.

2. **`NotInLuigiView` generic default:** "Hyperspace Portal" → what should the generic default be? Proposal: `"your portal"`. This should be confirmed with UX/content.

3. **"BTP Global Account ID" labels:** These appear in the workspace/project creation dialogs. In non-SAP deployments, is the underlying `chargingTargetId` field still present in the API response? If yes, we may need a configurable label. If no (SAP-only API field), it should be hidden when the API doesn't return it (already the case if the field is optional in the type schema).

4. **Sign-in hero image dimensions:** The current hero image is displayed at ~280px. Should a `<picture>` element with responsive sources be supported, or is one URL sufficient?

5. **Custom CSS security:** Allowing `customCssUrl` means operators can inject arbitrary CSS. This is acceptable for operator-controlled deployments but should be documented clearly. No `<style>` injection (only `<link>`) to keep the CSP manageable.

---

## Files Changed (expected scope)

```
frontend-config.json                                  (template + docs update)
src/context/FrontendConfigContext.tsx                 (Zod schema extension)
src/lib/shared/useLink.ts                             (move 2 hardcoded URLs to config)
src/views/ProjectList.tsx                             (move hardcoded URL to useLink)
src/components/Core/FeedbackButton.tsx                (configurable URL, hide if null)
src/components/Core/ShellBar.tsx                      (logo + appName from config)
src/spaces/onboarding/pages/SignInPage/SignInPage.tsx (hero image + funding logo flag)
src/locales/en.json                                   (fix hardcoded product names)
src/utils/i18n/i18n.ts                               (translation override loader)
server/telemetry/bootstrap/opentelemetry-init.ts      (OTEL_SERVICE_NAME env var)
server/plugins/brand-assets.ts                        (new: static handler for /brand/)
server/plugins/webmanifest.ts                         (new: dynamic site.webmanifest)
server/plugins/index-html-branding.ts                 (new or extend existing plugin)
server.ts                                             (register new plugins)
docs/operator/whitelabel.md                           (new operator guide)
```

---

## References

- GitHub issue: [openmcp-project/backlog#595](https://github.com/openmcp-project/backlog/issues/595)
- Depends on: [Epic #514 — Enable PlatformService contributions](https://github.com/openmcp-project/backlog/issues/514)
- Related: [Epic #419 — UI as a PlatformService](https://github.com/openmcp-project/backlog/issues/419)
- `FrontendConfigContext`: `src/context/FrontendConfigContext.tsx`
- `useLink`: `src/lib/shared/useLink.ts`
- Brand asset injection pattern: `server/telemetry/client-injection/dynatrace.ts` (reference for index.html patching approach)
