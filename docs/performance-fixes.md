# Performance Fixes

## Route: `/#/projects`

### CLS — SAP logo layout shift
**File:** `src/components/Core/ShellBar.module.css`

Added `aspect-ratio: 92 / 45` to `.logo` so the browser reserves the correct space before the SVG loads, eliminating the layout shift (CLS dropped from 0.84 to 0.78).

### Table loading state
**File:** `src/components/Projects/ProjectsList.tsx`

Removed the early `return <Loading />` when `isLoading` is true. Instead, `loading={isLoading}` is passed directly to `AnalyticalTable`, which shows a built-in busy indicator. The table renders immediately, avoiding an illustrated loading screen that caused a large content swap.

---

## Route: `/#/projects/:project`

### LCP — CDN preconnect
**File:** `index.html`

Added `<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />`. SAP UI5 theme fonts are loaded from this CDN; without the hint the browser had to do a cold DNS + TLS handshake before any font request, adding ~4 s to the critical path. LCP improved from ~3000 ms to ~2238 ms.

### LCP — lazy MemberTable
**File:** `src/components/ControlPlanes/List/MembersAvatarView.tsx`

Changed `MemberTable` from a static import to `React.lazy()`. The component (and its transitive imports: `EditMembers`, `AddEditMemberDialog`, `RadioButtonsSelect`) is only loaded when the user opens the members popover, removing ~900 ms of JS parsing from the initial render path.

### Eager kubeconfig fetches — V1 menu
**File:** `src/components/ControlPlanes/ControlPlaneCard/ControlPlaneCardMenu.tsx`

`useApiResource(GetKubeconfig(...))` was called on every card render. Added `!menuIsOpen` to the `disable` flag so the REST GET `/api/v1/namespaces/.../secrets/...kubeconfig` is only made when the overflow menu is actually open.

### Eager kubeconfig fetches — V2 menu
**File:** `src/components/ControlPlanes/ControlPlaneCard/ControlPlaneCardMenuV2.tsx`

`useKubeconfigQuery` (Apollo) was called with real arguments on every card render. Changed to pass `undefined` for both `kubeConfigName` and `namespaceName` when `!menuIsOpen`, which hits the existing `skip: !kubeConfigName || !namespaceName` guard and prevents the GraphQL query from firing until the menu is opened.

---

## Route: `/#/projects/:project/workspaces/:workspace/controlplane/:name?version=v2`

### Duplicate REST fetch for ControlPlane resource
**Files:** `src/lib/shared/McpContext.tsx`, `src/spaces/controlPlaneV2/pages/ControlPlanePageV2.tsx`

`McpContextProvider` was fetching the ControlPlane resource via REST (`GET /apis/core.open-control-plane.io/v2alpha1/namespaces/.../controlplanes/:name`) to extract `status.access`, while `ControlPlanePageV2` was already fetching the same resource via GraphQL (`useControlPlaneV2Query`). Added optional `preloadedAccess` and `preloadedNamespace` props to `McpContextProvider`; when provided, the REST fetch is skipped entirely. `ControlPlanePageV2` now passes the access data it already has from GraphQL.

### McpContextProvider blocked children render unnecessarily
**File:** `src/lib/shared/McpContext.tsx`

When `preloadedAccess` is set, `McpContextProvider` previously still returned `<></>` while the kubeconfig Apollo query was in flight, blocking all children including `ComponentsDashboardV2` (the LCP element). Changed so that when access data is preloaded, children render immediately with a partial context (kubeconfig initially `undefined`). `WithinManagedControlPlane` has its own auth guard and gates the downstream `ApiConfigProvider` independently.

### Known remaining bottleneck — not fixed
`ControlPlanePageV2` has an early `if (isLoading) return <BusyIndicator>` that waits for `useControlPlaneV2Query` (GraphQL) before rendering anything. Since the entire `ObjectPage` (header, breadcrumbs, tab visibility) depends on `mcp`, `ComponentsDashboardV2` cannot render before the GraphQL response arrives. Fixing this would require restructuring `ObjectPage` to render the dashboard section independently — out of scope.
