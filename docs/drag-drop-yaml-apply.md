# YAML Apply — Feature Specification

## Overview

Add a global mechanism that lets users apply Kubernetes YAML resources directly from the UI, without `kubectl`. Two entry points feed the same flow: dragging a `.yaml` / `.yml` file anywhere onto the browser window, or clicking an **Upload YAML** button in the ShellBar. A full-screen dialog opens, presents each document in a Monaco editor with live Intellisense driven by the target cluster's CRD schemas, validates the resource against the server via a Kubernetes dry-run before any mutation, and applies it with one button click.

Both target APIs are supported and selected automatically from the current route:

- **Control Plane target** — the user is on a CP detail page (`/projects/:p/workspaces/:w/controlplane/:cp`). Resources are applied via Kubernetes Server-Side Apply (PATCH `application/apply-patch+yaml`).
- **Onboarding API target** — any other page (projects / workspaces). Only `Project` and `Workspace` kinds are accepted; applied via Apollo GraphQL mutations.

---

## User-Facing Flows

### 1. Drag and Drop

1. The user starts dragging a file anywhere over the browser window.
2. The moment a `Files` drag is detected, a **full-viewport overlay** fades in over the current page content (see [Drag-Drop Overlay](#drag-drop-overlay)).
3. The overlay shows which API will receive the file. If the user is on a CP page the chip reads the CP name; otherwise it reads "Onboarding API".
4. The user releases the file. The overlay fades out and the Apply Dialog opens immediately.
5. If the user presses **Escape**, or drags the file back out of the browser window, the overlay dismisses without opening the dialog.
6. Only the **first file** of a multi-file drop is processed. All other files are silently ignored.

### 2. ShellBar Upload Button

1. A **Upload YAML** button sits in the ShellBar alongside the other global actions, always visible regardless of the current route.
2. Clicking it opens the OS file picker, filtered to `.yaml` and `.yml`.
3. After the user selects a file the Apply Dialog opens — identical flow to drag-and-drop from step 4 above.
4. The file input is reset after selection so the same file can be re-selected in the same session.

### 3. Apply Dialog — Single Document

1. The dialog opens in the **Parsing** phase: a centered `BusyIndicator` with the label "Reading file…".
2. On parse success the dialog transitions to the **Editing** phase:
   - The header shows "Apply YAML" as the title, with a subtitle line: the resource's `kind/name` and a target chip (CP name or "Onboarding API").
   - The editor area fills the dialog body. Monaco renders immediately; a slim info strip beneath the editor reads "Loading schema for {kind}…" while the CRD schema is being fetched. Once loaded the strip disappears and full Intellisense is active.
   - An existence check runs concurrently with schema loading. Its result controls the intent strip above the footer (see [Apply Button and Intent Strips](#apply-button-and-intent-strips)).
3. The user reviews or edits the YAML. The Apply button is disabled while the editor content is syntactically broken or has schema validation errors.
4. The user clicks **Apply** / **Overwrite**:
   - The button label changes to "Validating…" and shows a spinner. The button is disabled.
   - A Kubernetes dry-run is sent to the server. On failure a red `MessageStrip` appears in the footer area with the server's rejection reason; the button reverts to its original label and the user can fix the YAML and retry.
   - On dry-run success the real apply is sent. The button shows "Applying…".
   - On apply success the dialog closes (single-document case) or advances to the next resource (multi-document).
   - On apply failure a red `MessageStrip` replaces the footer strip; the button reverts so the user can retry.
5. The user can click **Cancel** at any time to discard and close.

### 4. Apply Dialog — Multiple Documents

When the file contains more than one YAML document (separated by `---`) the layout switches to a two-panel view:

- **Left panel (sidebar, ~240 px wide):** a scrollable list of all documents. Each row shows a status icon, the `kind/name` label, and is highlighted to reflect its current result status. A `ProgressIndicator` bar at the top of the sidebar shows the fraction of documents processed.
- **Right panel:** the Monaco editor for the currently selected document, occupying all remaining space. The header subtitle updates to reflect the current `kind/name`.

The user works through documents in order. The sidebar highlights the current document. After applying one document the dialog automatically advances to the next pending one. The user can also click any sidebar row to jump to that document; rows already in `applied` state are still navigable (read-only view).

### 5. Dry-Run Validation

Dry-run runs automatically as the first step whenever the user clicks Apply / Overwrite. The implementer **must not** expose a separate "Validate" button — the two-step flow (validate → apply) is transparent to the user and presented as a single action.

The Apply button communicates both steps through its label and icon:

| Step                        | Button label            | Button state                        |
| --------------------------- | ----------------------- | ----------------------------------- |
| Existence check in progress | Apply _(spinner)_       | Disabled                            |
| Dry-run in progress         | Validating… _(spinner)_ | Disabled                            |
| Dry-run failed              | Apply / Overwrite       | Enabled, red MessageStrip in footer |
| Dry-run passed, applying    | Applying… _(spinner)_   | Disabled                            |

After a dry-run failure the error strip remains visible until the user edits the YAML (any `onContentChange` event clears `dryRunResult` and dismisses the strip), making it obvious that the previous validation result is stale.

### 6. Summary Screen

After all documents in the file have been processed (applied, failed, or skipped) the dialog transitions to the **Summary** phase:

- A large `IllustratedMessage` occupies the upper portion: use the "SuccessHighFive" illustration when every resource applied successfully, "ErrorScreen" when at least one failed.
- Below the illustration, a row of three `ObjectStatus` or `Tag` components shows the counts: **Applied** (Positive / green), **Failed** (Negative / red), **Skipped** (Critical / orange). Zero-count items are hidden.
- Below the counts, a compact `List` (non-interactive) recaps each resource: status icon, `kind/name`, and — for failed ones — the one-line error message truncated to fit. The user can expand failed rows to see the full message.
- A single **Done** button in the footer closes the dialog.

### 7. Error States

| Situation                                                         | UX                                                                                                                                                                                                                              |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File extension not `.yaml` / `.yml`                               | The dialog opens in `parse-error` phase immediately. Show `IllustratedMessage` "ErrorScreen", title "Unsupported file type", description "Only .yaml and .yml files are accepted.", Close button.                               |
| YAML syntax error                                                 | `parse-error` phase. `IllustratedMessage` "ErrorScreen", title "Cannot parse file", description shows the filename and the parser error message, Close button.                                                                  |
| Missing required field (`apiVersion`, `kind`, or `metadata.name`) | `parse-error` phase (or per-document `failed` in multi-doc). Show the specific missing field in the description.                                                                                                                |
| Kind not supported on the Onboarding target                       | Show `IllustratedMessage` in the editor panel, title "Kind not supported", description "Only `Project` and `Workspace` resources can be applied to the Onboarding API." The sidebar marks this row with an orange warning icon. |
| Kind unknown on CP target (CRD not installed)                     | Same `IllustratedMessage` pattern, description "Kind `{kind}` is not installed on this Control Plane. Deploy the CRD before applying this resource."                                                                            |
| Dry-run rejected (422 / admission webhook)                        | Red `MessageStrip` in footer with the Kubernetes `Status.message`. Button reverts to Apply / Overwrite.                                                                                                                         |
| Apply failed (network or server error)                            | Same red `MessageStrip`. Resource is marked `failed` in the sidebar; dialog stays open.                                                                                                                                         |
| Schema fetch failed (CRD not reachable)                           | The "Loading schema for {kind}…" info strip changes to a Warning strip "Schema unavailable — Intellisense disabled." Editor remains fully usable without schema.                                                                |

---

## Visual Design

### Drag-Drop Overlay

```
┌──────────────────────────────────────────────────────────────────────┐
│  [semi-transparent backdrop, backdrop-filter: blur(2px)]             │
│                                                                       │
│              ┌─────────────────────────────────┐                    │
│              │  [upload cloud icon, 56 × 56]    │                    │
│              │                                  │                    │
│              │   Drop YAML to apply             │                    │
│              │                                  │                    │
│              │   ┌──────────────────────────┐  │                    │
│              │   │ ● Control Plane: my-cp   │  │  ← Tag (Positive)  │
│              │   └──────────────────────────┘  │                    │
│              │                                  │                    │
│              │   Release to open apply dialog   │                    │
│              └─────────────────────────────────┘                    │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

- Backdrop: `background: rgba(0, 0, 0, 0.45)`, `backdrop-filter: blur(2px)`. Use `@media (prefers-color-scheme: dark)` and `[data-ui5-theme*="dark"]` to ensure contrast on both themes.
- Card: white / surface-1 background, `border-radius: 1rem`, soft `box-shadow`, centered with flexbox, roughly `360 × 220 px`.
- Overlay fades in with a CSS `opacity` transition (`0 → 1`, ~150 ms) to avoid jarring appearance.
- Target chip: UI5 `Tag` from `@ui5/webcomponents-react`. Use `design="Positive"` (green) for a CP target, `design="Information"` (blue) for Onboarding API. Include a leading icon (`sap-icon://database` for CP, `sap-icon://cloud` for Onboarding).
- Upload icon: `sap-icon://upload-to-cloud` at `3.5rem`, colour `var(--sapContent_IconColor)`.

### Apply Dialog Layout

The dialog is a UI5 `Dialog` from `@ui5/webcomponents-react`. Minimum width `860 px`; height fills the viewport with a small margin (`min-height: 80vh`).

**Header:**

- Left: title "Apply YAML" (`titleText` prop).
- Below title: a subtitle with the target chip (same Tag design as the overlay) and — in multi-doc mode — "Resource 2 of 5" counter text.

**Body (single-document):**

```
┌──────────────────────────────────────────────────────────────────────┐
│  [intent strip: overwrite warning OR existence unknown]              │
│  [dry-run result strip: positive / negative, shown after attempt]    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│   Monaco editor (full remaining height, monaco-yaml Intellisense)    │
│                                                                       │
├──────────────────────────────────────────────────────────────────────┤
│  [schema info strip: "Loading schema for {kind}…" | disappears]      │
└──────────────────────────────────────────────────────────────────────┘
```

**Body (multi-document):**

```
┌───────────────┬──────────────────────────────────────────────────────┐
│  [Progress    │  [intent strip]                                      │
│   Indicator]  │  [dry-run result strip]                              │
│               ├──────────────────────────────────────────────────────┤
│  ┌─────────┐  │                                                      │
│  │✓ Dep../  │  │   Monaco editor                                     │
│  │  name   │  │                                                      │
│  ├─────────┤  │                                                      │
│  │● CRB/..│  │                                                      │
│  ├─────────┤  │                                                      │
│  │✗ SA/er │  │                                                      │
│  └─────────┘  ├──────────────────────────────────────────────────────┤
│               │  [schema info strip]                                 │
└───────────────┴──────────────────────────────────────────────────────┘
```

- Sidebar width: `240 px`, fixed, `overflow-y: auto`.
- Each sidebar row is a UI5 `ListItem` (or `CustomListItem`). Left-align the status icon; right-align a compact `ObjectStatus` when `failed` (shows "Failed" in red).
- The row for the currently active resource has the UI5 selection highlight.
- Failed rows show their `kind/name` text in red (`--sapCriticalElementColor`).

**Footer (always):**

```
[Cancel]                          [Apply / Overwrite / Validating… / Applying…]
```

- Cancel is a plain `Button` (default design).
- Apply / Overwrite is `Button design="Emphasized"` (blue) for create, `Button design="Negative"` (red) for overwrite. During dry-run and apply it shows a spinner via the `icon` slot (`sap-icon://synchronize` spinning, or a `BusyIndicator` inline).

### Per-Resource Status Icons

| State / Status           | Icon                                | Colour                               |
| ------------------------ | ----------------------------------- | ------------------------------------ |
| `checking`               | `sap-icon://pending` (animated)     | neutral                              |
| `idle` (new resource)    | `sap-icon://document`               | neutral                              |
| `idle` (resource exists) | `sap-icon://edit-document`          | neutral                              |
| `unsupported`            | `sap-icon://alert`                  | `--sapCriticalElementColor` (orange) |
| `dry-running`            | `sap-icon://synchronize` (animated) | neutral                              |
| `applying`               | `sap-icon://synchronize` (animated) | `--sapPositiveElementColor`          |
| `applied`                | `sap-icon://accept`                 | `--sapPositiveElementColor` (green)  |
| `failed`                 | `sap-icon://error`                  | `--sapNegativeElementColor` (red)    |

### Apply Button and Intent Strips

Strips are rendered between the dialog header and the Monaco editor. Only one strip is shown at a time (priority top to bottom):

1. **Dry-run result — failed** (`MessageStrip design="Negative"`): "Validation failed: {Status.message}". Dismissed by editing the YAML.
2. **Dry-run result — passed** (`MessageStrip design="Positive"`): "Validation passed — resource is valid." Dismissed by editing the YAML.
3. **Overwrite warning for existing CP resource** (`MessageStrip design="Critical"`): "This resource already exists. Applying will overwrite it using Server-Side Apply."
4. **Overwrite warning for existing Workspace** (`MessageStrip design="Critical"`): "This workspace already exists. Applying will overwrite its configuration."
5. **Project already exists** (`MessageStrip design="Information"`): "This project already exists. A create mutation will be sent; the server may reject it."
6. **Schema loading** (`MessageStrip design="Information"`, below editor): "Loading schema for {kind}…" Replaced by a Warning strip if the CRD fetch fails.

Strips 3–5 are persistent (reflect `resourceExists` state). Strips 1–2 are transient (reflect `dryRunResult` state and clear on edit).

### Summary Screen

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                  [IllustratedMessage: SuccessHighFive]                │
│                   "All resources applied successfully"                │
│                                                                       │
│         ✓ 4 Applied    ✗ 1 Failed    ⚠ 0 Skipped                    │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │ ✓  Deployment / my-app                                      │    │
│   │ ✓  Service / my-app-svc                                     │    │
│   │ ✗  ConfigMap / config     "field X is immutable"     [...]  │    │
│   └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│                                              [Done]                  │
└──────────────────────────────────────────────────────────────────────┘
```

- Use `@ui5/webcomponents-fiori` `IllustratedMessage`.
  - All applied: `name="SuccessHighFive"`, title "All resources applied", description "Your YAML was applied to {target}."
  - Mixed: `name="SuccessCheckMark"`, title "{n} of {total} resources applied".
  - All failed: `name="ErrorScreen"`, title "Apply failed", description "No resources were applied."
- Counts row: three `ObjectStatus` components (`state="Positive"`, `"Negative"`, `"Critical"`). Hide zero-count items.
- Resource list: a non-interactive UI5 `List` (`mode="None"`). Failed rows include the error message, truncated to one line with a `Button design="Transparent"` labelled "Details" that expands a `Text` block below the row.

---

## Architecture

### Context and Provider Tree

```
YamlApplyContextProvider          src/context/YamlApplyContext.tsx
  ShellBarComponent                src/components/Core/ShellBar.tsx
  SplitterProvider
    DragDropYamlProvider           src/components/DragDrop/DragDropYamlProvider.tsx
      SplitterLayout
        HashRouter / SentryRoutes
          ControlPlanePageV2       → renders McpDragDropRegistrar
          ProjectPage
          ProjectListView
```

`YamlApplyContextProvider` must sit **above** `DragDropYamlProvider` and **above** `ShellBarComponent` so that both the ShellBar button and the drag-drop provider share the same state instance.

### `YamlApplyContext` (`src/context/YamlApplyContext.tsx`)

| Field         | Type                | Purpose                                            |
| ------------- | ------------------- | -------------------------------------------------- |
| `activeMcp`   | `McpTarget \| null` | Which CP is in focus; `null` = Onboarding target.  |
| `pendingFile` | `File \| null`      | File queued for the dialog; setting this opens it. |

```ts
type McpTarget = { name: string; apiConfig: ApiConfig };
```

Methods: `setActiveMcp(target | null)`, `requestApplyFile(file)`, `clearPendingFile()`.

### `McpDragDropRegistrar` (`src/components/ControlPlane/McpDragDropRegistrar.tsx`)

Render-nothing component placed inside `ControlPlanePageV2`. On mount calls `setActiveMcp({ name, apiConfig })` built from `McpContext`; on unmount calls `setActiveMcp(null)`.

### `DragDropYamlProvider` (`src/components/DragDrop/DragDropYamlProvider.tsx`)

Attaches `dragenter`, `dragleave`, `dragover`, `drop`, and `keydown` listeners to `document`. Uses a `dragCounter` ref (not state) to prevent flickering from nested enter/leave events. Renders:

- `<DragDropOverlay onCancel={…} />` when `isDragging && !pendingFile`.
- `<YamlApplyDialog file={pendingFile} … />` when `pendingFile` is set.

### Dialog Phase Machine

```
parsing ──(success)──→ editing ──(all processed)──→ summary
        ──(failure)──→ parse-error
```

### Per-Resource State Machine

```
[mount] → checking ──(kind unknown / unsupported)──→ unsupported
                   ──(success)──→ idle

idle → [user clicks Apply]
     → dry-running ──(fail)──→ idle  (dryRunResult = 'failed')
                   ──(pass)──→ applying ──(success)──→ [advance / summary]
                                        ──(failure)──→ idle  (itemStatus = 'failed')
```

`dryRunResult: 'passed' | 'failed' | null` resets to `null` on any `onContentChange` event from the editor.

### Schema Loading (Monaco Intellisense)

`YamlResourceEditorSchemaLoader` (`src/components/Yaml/YamlResourceEditorSchemaLoader.tsx`) receives `kind`, `apiGroupName`, `apiVersion` from the active resource and:

1. Calls `useCustomResourceDefinitionQuery({ kind, apiGroupName, apiVersion })` (`src/hooks/useCustomResourceDefinitionQuery.ts`).
2. That hook calls `useResourcePluralNames` to resolve `kind` → CRD plural by fetching `/apis/apiextensions.k8s.io/v1/customresourcedefinitions` via SWR.
3. Fetches the individual CRD at `/apis/apiextensions.k8s.io/v1/customresourcedefinitions/{plural}.{apiGroup}`.
4. Extracts `spec.versions[matched].schema.openAPIV3Schema`, converts to JSON Schema 4 via `openapiSchemaToJsonSchema`.
5. `YamlEditor` calls `updateYamlSchemas([{ schema, fileMatch: ['*'], uri: KUBERNETES_SCHEMA_URI }])` on the global `monaco-yaml` singleton (`src/lib/monaco.ts`).

The editor is keyed on `currentIndex` so it fully remounts per resource (prevents stale schema bleed-over). While `isLoading` is true, show the "Loading schema…" info strip below the editor — do **not** block the editor render itself.

### API Calls (`src/hooks/useYamlApplyResource.ts`)

This module exports **pure async functions only** (no React hooks).

#### Control Plane path

```ts
// Existence check
checkCpResourceExists(resource, pluralKind, apiConfig): Promise<boolean>
// GET via fetchApiServerJson; returns false on 404, throws on other errors.

// Dry-run
dryRunCpResource(resource, pluralKind, apiConfig): Promise<void>
// PATCH application/apply-patch+yaml with ?fieldManager=openmcp-ui&force=true&dryRun=All
// Throws on non-2xx; caller reads the Kubernetes Status object from the error.

// Real apply
applyCpResource(resource, pluralKind, apiConfig): Promise<void>
// Same PATCH without dryRun=All.
```

`buildCpPath(apiVersion, plural, namespace?, name?)` constructs the URL: core resources use `/api/{version}/…`, group resources use `/apis/{group}/{version}/…`.

#### Onboarding path

```ts
checkOnboardingResourceExists(resource, client): Promise<boolean>
// Apollo query: GetProjectQuery or GetWorkspaceQuery, fetchPolicy: 'network-only'.

applyOnboardingResource(resource, exists, client, dryRun?: boolean): Promise<OnboardingApplyResult>
// Apollo mutation with { dryRun } variable.
// Project: always CreateProjectMutation (never update).
// Workspace: CreateWorkspaceMutation (new) or UpdateWorkspaceMutation (exists).
// On workspace apply, refetchQueries: ['GetWorkspaces', 'GetWorkspace'].
```

GraphQL mutations already declare `$dryRun: Boolean`; pass `{ dryRun: true }` in `variables` for the dry-run call.

`buildProjectInput` and `buildWorkspaceInput` map a raw `ParsedResource` to the respective GraphQL input types, including `openmcp.cloud/display-name` annotation and `chargingTarget` / `chargingTargetType` labels.

---

## Implementation Guide

### Files to Create

| File                                                   | Responsibility                                                |
| ------------------------------------------------------ | ------------------------------------------------------------- |
| `src/context/YamlApplyContext.tsx`                     | Context, provider, `useYamlApply()` hook, `McpTarget` type.   |
| `src/components/DragDrop/DragDropYamlProvider.tsx`     | Global drag listeners; renders overlay or dialog.             |
| `src/components/DragDrop/DragDropOverlay.tsx`          | Full-viewport drop-target UI with target chip.                |
| `src/components/DragDrop/YamlApplyDialog.tsx`          | Apply dialog: phase machine, editor, sidebar, footer.         |
| `src/components/DragDrop/DragDropOverlay.module.css`   | Overlay backdrop, card, fade-in animation.                    |
| `src/components/DragDrop/YamlApplyDialog.module.css`   | Dialog layout: two-panel split, sidebar, strip stacking.      |
| `src/components/ControlPlane/McpDragDropRegistrar.tsx` | Side-effect component that registers/deregisters `activeMcp`. |
| `src/hooks/useYamlApplyResource.ts`                    | Pure functions: parse, validate, dry-run, apply (both paths). |
| `src/hooks/useYamlApplyResource.spec.ts`               | Vitest unit tests (see [Tests](#tests)).                      |

### Files to Modify

| File                                                         | Change                                                                                                      |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `src/AppRouter.tsx`                                          | Wrap app tree in `YamlApplyContextProvider` and `DragDropYamlProvider` (in that order, outside the Router). |
| `src/components/Core/ShellBar.tsx`                           | Add `UploadYamlShellBarButton`: hidden `<input type="file">` + UI5 `Button` calling `requestApplyFile`.     |
| `src/spaces/mcp/controlPlaneV2/pages/ControlPlanePageV2.tsx` | Render `<McpDragDropRegistrar />` inside the page.                                                          |
| `src/components/Yaml/YamlResourceEditorSchemaLoader.tsx`     | Ensure it accepts `kind`, `apiGroupName`, `apiVersion` as props and exposes `onValidityChange`.             |
| `src/locales/en.json`                                        | Add all `yamlApply.*` i18n keys (see [i18n Keys](#i18n-keys)).                                              |

### i18n Keys

Add under the `yamlApply` namespace in `src/locales/en.json`:

```jsonc
"yamlApply": {
  // Overlay
  "overlayTitle": "Drop YAML to apply",
  "overlayHint": "Release to open apply dialog",
  "overlayTargetCp": "Control Plane: {{name}}",
  "overlayTargetOnboarding": "Onboarding API",

  // Dialog header
  "dialogTitle": "Apply YAML",
  "dialogSubtitleCounter": "Resource {{current}} of {{total}}",

  // Phases
  "phaseParsingLabel": "Reading file…",
  "phaseParseErrorTitle": "Cannot parse file",
  "phaseParseErrorUnsupportedType": "Only .yaml and .yml files are accepted.",
  "phaseParseErrorSyntax": "{{filename}}: {{message}}",
  "phaseParseErrorMissingField": "Missing required field: {{field}}",
  "phaseSummaryAllApplied": "All resources applied",
  "phaseSummaryAllAppliedDesc": "Your YAML was applied to {{target}}.",
  "phaseSummaryPartial": "{{applied}} of {{total}} resources applied",
  "phaseSummaryAllFailed": "Apply failed",
  "phaseSummaryAllFailedDesc": "No resources were applied.",
  "summaryApplied": "{{count}} Applied",
  "summaryFailed": "{{count}} Failed",
  "summarySkipped": "{{count}} Skipped",

  // Unsupported kind
  "unsupportedKindTitle": "Kind not supported",
  "unsupportedKindOnboarding": "Only Project and Workspace resources can be applied to the Onboarding API.",
  "unsupportedKindCp": "Kind {{kind}} is not installed on this Control Plane. Deploy the CRD before applying this resource.",

  // Schema
  "schemaLoading": "Loading schema for {{kind}}…",
  "schemaUnavailable": "Schema unavailable — Intellisense disabled.",

  // Intent strips
  "warnOverwriteCp": "This resource already exists. Applying will overwrite it using Server-Side Apply.",
  "warnOverwriteWorkspace": "This workspace already exists. Applying will overwrite its configuration.",
  "infoProjectExists": "This project already exists. A create mutation will be sent; the server may reject it.",

  // Dry-run
  "dryRunPassed": "Validation passed — resource is valid.",
  "dryRunFailed": "Validation failed: {{message}}",

  // Buttons
  "buttonApply": "Apply",
  "buttonOverwrite": "Overwrite",
  "buttonValidating": "Validating…",
  "buttonApplying": "Applying…",
  "buttonCancel": "Cancel",
  "buttonDone": "Done",
  "buttonClose": "Close",
  "buttonDetails": "Details",

  // Error details in summary
  "summaryItemFailed": "Failed: {{message}}"
}
```

### Tests

**`src/hooks/useYamlApplyResource.spec.ts`** — Vitest unit tests (no React, no network):

- `validateYamlFile`: valid single-doc, `.yml` extension, non-YAML extension → `wrong-file-type`, malformed YAML → `parse-error`, missing `apiVersion` / `kind` / `metadata.name` → `missing-fields`.
- `parseYamlDocuments`: multi-document, blank `---` separators skipped, first invalid doc fails the whole parse, file with only blank documents → `empty-file`.
- `buildCpPath`: core resource (`v1` with no group), group-versioned resource, namespaced vs cluster-scoped.
- `dryRunCpResource` / `applyCpResource`: mock `fetchApiServerJson`; assert correct path, method, content type, query string (with / without `dryRun=All`).
- `applyOnboardingResource`: mock Apollo client; Project always calls `CreateProjectMutation`; Workspace calls create or update based on `exists`; `dryRun: true` is forwarded in variables; workspace apply triggers `refetchQueries`.

Add Cypress component tests in `YamlApplyDialog.cy.tsx` for the dialog's visual states: `parsing`, `editing` (single-doc and multi-doc), `parse-error`, `unsupported`, dry-run fail strip, dry-run pass strip, `summary`. Use injectable hook props per the project's testability convention.
