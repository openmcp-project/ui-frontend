# Branding

The `branding` block in `frontend-config.json` lets you white-label the UI for your organisation. Every field is optional — if omitted, the UI falls back to the default OpenControlPlane look.

```json
{
  "branding": {
    "appName": "Control Plane UI",
    "portalName": "the portal",
    "primaryColor": "#0070f2",
    "logo": "data:image/svg+xml;base64,...",
    "favicon": "data:image/svg+xml;base64,..."
  }
}
```

## Fields

### `appName`

**Default:** `"Control Plane UI"`

The name of the application. Shown in:

- the browser tab title
- the sign-in page heading
- the top navigation bar (when no Control Plane is selected)
- the `alt` text of the logo and the app icon

### `portalName`

**Default:** `"the portal"`

The name of the outer portal that hosts this UI (e.g. an SAP BTP portal or an internal developer portal). Used in the "not embedded" error page that appears when the UI is opened outside its expected portal frame.

### `primaryColor`

**Default:** none (uses the SAP Horizon default brand colour `#0070f2`)

A hex, `rgb()`, or `rgba()` colour value that replaces the SAP Horizon brand colour throughout the UI. Affects buttons, links, tabs, input focus rings, selection highlights, and the shell navigation bar. Darker variants for hover/active states are derived automatically.

Also recolours the OpenControlPlane app icon on the sign-in page — light, dark, and muted shades are computed from the primary colour using HSL arithmetic.

**Example:** `"#006262"` for a teal brand.

### `logo`

**Default:** none (the OpenControlPlane SVG icon is shown in the top navigation bar)

A URL or `data:` URI for the logo image displayed in the top navigation bar (the shell bar). Accepts any format a browser `<img>` tag accepts. `data:` URIs work because the Content Security Policy includes `img-src 'self' data:`.

If omitted, no image appears in the shell bar (the `appName` text is used as the primary title instead).

### `favicon`

**Default:** none (the favicon bundled in the HTML is used)

A URL or `data:` URI for the browser tab icon. Replaces all `<link rel="icon">` elements in `<head>` at runtime. Same format rules as `logo`.

## How to supply image values

Both `logo` and `favicon` can be specified as inline `data:` URIs, which avoids hosting the image separately:

```bash
# Convert an SVG to a base64 data URI (macOS / Linux)
echo "data:image/svg+xml;base64,$(base64 -i logo.svg)" 
```

For PNG files, change the MIME type:

```bash
echo "data:image/png;base64,$(base64 -i favicon.png)"
```
