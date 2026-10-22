# Whitelabel Implementation Summary

## What was implemented

The app is now fully whitelabel: any organization can deploy it under their own brand by supplying a `frontend-config.json` — no code changes, no rebuilds.

---

## Changes at a glance

| Area | What changed |
|------|-------------|
| `frontend-config.json` | Added `branding` block (name, logo, hero image, funding logo) and `feedbackUrl` |
| `FrontendConfigContext.tsx` | Zod schema extended with `branding` and `feedbackUrl`; `defaultBranding` constant exported for tests |
| `ShellBar.tsx` | Logo from config (falls back to `BrandLogoPlaceholder`); app title from `branding.appName` |
| `BrandLogoPlaceholder.tsx` | **New file** — neutral SVG monogram from the first letter of `appName` |
| `SignInPage.tsx` | Hero image, funding logo, and welcome text all from config |
| `App.tsx` | `document.title` set reactively from `branding.appName` |
| `en.json` | `welcomeMessage`, `titleMessage`, `subtitleMessage` now interpolate `{{appName}}` / `{{portalName}}` |
| `NotInLuigiView.tsx` | Portal name interpolated from `branding.portalName` |
| `FeedbackButton.tsx` | "Report issue" link uses `feedbackUrl` from config; hidden when `feedbackUrl` is `null` |
| `useLink.ts` | `identityProviderGuide` and new `projectsGuide` now built from `documentationBaseUrl` |
| `ProjectList.tsx` | `LEARN_MORE_URL` constant replaced with `useLink().projectsGuide` |
| `opentelemetry-init.ts` | `serviceName` reads `OTEL_SERVICE_NAME` env var (falls back to `'ui-frontend-bff'`) |
| `server.ts` | `/frontend-config.json` served with `cache-control: no-store` so branding changes propagate immediately |
| SAP image files | Removed from codebase; Base64-encoded into `frontend-config.json` |

---

## The config structure

```json
{
  "documentationBaseUrl": "https://your-docs-site.example",
  "githubBaseUrl": "https://github.com/your-org",
  "feedbackUrl": "https://github.com/your-org/your-repo/issues/new",
  "branding": {
    "appName": "My Control Plane",
    "portalName": "My Portal",
    "logo": "data:image/svg+xml;base64,…",
    "heroImage": "data:image/png;base64,…",
    "showFundingLogo": false,
    "fundingLogo": null
  }
}
```

All `branding` fields are optional — the app ships with safe defaults. Images are Base64 data URIs so there are no extra HTTP requests and no CSP issues.

---

## Explain like I'm five

Imagine the app is a blank t-shirt. Before, the SAP logo was printed directly on the fabric — you couldn't remove it without ruining the shirt. Now the logo is a **sticker**. Each customer gets the same shirt but slaps their own sticker on it.

That sticker lives in a small JSON file (`frontend-config.json`) that the server reads when it starts. The file contains:

- **The app's name** — shown in the browser tab, the top bar, and the welcome screen
- **A logo** — Base64-encoded (the whole image is just a really long piece of text inside the JSON)
- **A hero image** — the big picture on the login page
- **A funding logo** — the EU/BMWK badge; hidden by default, shown only when the JSON says so
- **Documentation and feedback links** — so each org can point to their own docs or issue tracker

When none of this is provided, the app shows a simple letter-in-a-box icon instead of a logo, and omits any links that aren't configured. SAP's own branding (logo, hero, funding badge) is now stored in the JSON too — not burned into the code — so SAP's deployment works exactly the same way as everyone else's.

The Docker image is identical for every customer. What makes each deployment look different is purely the JSON file passed in at startup.
