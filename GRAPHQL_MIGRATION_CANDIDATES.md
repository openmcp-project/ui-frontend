# REST → GraphQL Migration Candidates

> Analysis of the REST calls that flow through `src/lib/api/useApiResource.ts` (and other
> direct `fetchApiServer*` callers), assessed against the GraphQL schema in `schema.json`,
> to determine which can be replaced with GraphQL.
>
> Date: 2026-09-03 · Schema source: `schema.json` (the `/api/graphql` endpoint schema).

---

## TL;DR

The GraphQL schema is a **complete mirror of the Kubernetes API**, generated per API group:

- one root **Query** field per API group (dots → underscores), e.g. `core_openmcp_cloud`, `v1` (core), `apiextensions_k8s_io`;
- a version sub-field (`v1alpha1`, `v1`, `v2alpha1`, …);
- per resource kind: `Kind(name, namespace)` (get), `Kinds(labelselector, namespace, limit, continue, sortBy)` (list), and `KindYaml(...)` (YAML string);
- **Mutation** side: per-group `createX` / `updateX` / `deleteX` (all with `dryRun`), plus a generic `applyYaml(yaml)` and the k8s review verbs (`createSelfSubjectRulesReview`, …).

**GraphQL field selection replaces the `X-jq` header**, and `labelselector` replaces cluster-wide-then-filter patterns — both are upgrades, not just parity.

**The single most important constraint** is *which cluster the schema describes*:

> `schema.json` is the **CRATE-scoped** schema. It exposes crate objects
> (`managedcontrolplanes`, `projects`, `workspaces`, the `*_services_open_control_plane_io`
> component CRDs, core `v1`, `apiextensions.k8s.io`, `authorization.k8s.io`) but **NOT** the
> workload groups that live inside a drilled-in control plane — `source.toolkit.fluxcd.io`,
> `kustomize.toolkit.fluxcd.io`, `landscaper.gardener.cloud`, `pkg.crossplane.io`, or the
> per-provider `providerconfigs` groups.

This cleanly splits the codebase in two:

| Scope | What it is | GraphQL status |
|---|---|---|
| **Crate-scoped** calls (onboarding-level `ApiConfig`, `x-use-crate: true`) | control planes, projects, workspaces, membership, deletion of an MCP, crate CRDs, self-subject-rules | ✅ **Migratable today** against the existing `/api/graphql` schema |
| **MCP-cluster-scoped** calls (drilled-in view, `mcpConfig` routing headers `X-mcp`/`X-project`/`X-workspace`) | Flux, Kustomizations, Landscaper, Crossplane providers/managed resources, in-MCP configmaps/secrets/namespaces | ⛔ **Blocked** — see [Blockers](#blockers-for-mcp-cluster-scoped-calls) |

`McpContext.tsx` is where the boundary lives: it fetches the `ManagedControlPlane` object at
crate level, resolves a kubeconfig, then wraps its children in a **new** `mcpConfig`-scoped
`ApiConfigProvider`. Everything under that provider is MCP-cluster-scoped.

---

## Blockers for MCP-cluster-scoped calls

Migrating the drilled-in view to GraphQL requires backend work first. Two independent gaps:

1. **Routing.** The current Apollo client (`src/spaces/onboarding/services/ApolloClientProvider.tsx`)
   only ever sends `x-use-crate: true`. To reach a specific control plane's API server, the
   GraphQL gateway must honor the same routing headers the REST path uses
   (`X-project` / `X-workspace` / `X-mcp` / `X-mcp-version` / `X-mcp-idp`). This is
   mechanically feasible on the client (a per-operation `setContext` link, exactly like the
   existing `authLink`), but the **BFF/GraphQL gateway must support it**.
2. **Schema exposure.** Even with routing, `schema.json` does not contain the MCP workload
   groups. The gateway would need to expose the MCP cluster's (partly dynamic, CRD-driven)
   schema — Flux/Kustomize/Landscaper CRDs and per-provider `providerconfigs`.

Until both are addressed, the ✅ items below (all crate-scoped) are the actionable migration set.

---

## Migratable today (crate-scoped) ✅

| Call site | REST | GraphQL replacement | Notes |
|---|---|---|---|
| `McpContext.tsx`, `ManagedControlPlanePage.tsx`, `useMcpComponents.ts` | GET `…/managedcontrolplanes/{cp}` (v1) or `…/controlplanes/{cp}` (v2), get-by-name + heavy jq | `core_openmcp_cloud.v1alpha1.ManagedControlPlane(name, namespace)` / `core_open_control_plane_io.v2alpha1.ControlPlane(...)` | jq (spec.components / authorization / status.access) becomes GraphQL field selection. Same object the onboarding `useMcpsQuery`/`controlPlaneV2` hooks already query. |
| `ImportMembersDialog.tsx` | GET `…/projects/{name}` and `…/workspaces/{name}` (forced crate via `overrideMcpConfig=null`) | `core_openmcp_cloud.v1alpha1.Project(name)` / `.Workspace(name, namespace)` — select `spec.members` | Already forced to crate config, so a clean swap. |
| `EditManagedControlPlaneWizardDataLoader.tsx` | GET `…/managedcontrolplanes/{name}` (forced crate) | `core_openmcp_cloud.v1alpha1.ManagedControlPlane(name, namespace)` | — |
| `ProjectChooser.tsx` | POST `authorization.k8s.io/v1/selfsubjectrulesreviews` + jq for project names | Mutation `authorization_k8s_io.v1.createSelfSubjectRulesReview` (confirmed present) **or** reuse onboarding `useProjectsQuery` (already GraphQL) | Reusing the existing projects query is likely simpler than a rules-review mutation. |
| `useDeleteManagedControlPlane.ts` | PATCH (set deletion-confirmation annotation) + DELETE `…/managedcontrolplanes/{name}` | `applyYaml(yaml)` (annotation) + `core_openmcp_cloud` `deleteManagedControlPlane` mutation | List refresh here is **already GraphQL** (`refetchQueries(['GetMCPsList'])`). |

---

## Blocked — MCP-cluster-scoped, schema shape *exists* but data is on the MCP ⛔🟡

These have a matching GraphQL type in the schema, so they become migratable **the moment MCP
routing is supported** (no new schema needed):

| Call site | REST | GraphQL type (needs routing) |
|---|---|---|
| `McpConfigMaps.tsx` | GET `…/namespaces/{ns}/configmaps` + jq | `v1.ConfigMaps(namespace, labelselector)` |
| `McpSecrets.tsx` | GET `…/namespaces/{ns}/secrets` + jq | `v1.Secrets(namespace, labelselector)` |
| `useNamespaceSelect.ts` (used by both above) | GET `/api/v1/namespaces` + jq name-only | `v1.Namespaces` — select `metadata.name` |
| `useMcpAuthorizationCheck.ts` | GET `…/customresourcedefinitions` (jq auth probe) | `apiextensions_k8s_io.v1.CustomResourceDefinitions` (or a `SelfSubjectAccessReview`) |
| `useResourcePluralNames.ts` / `useCustomResourceDefinitionQuery.ts` (`useCRDItemsMapping`) | GET `…/customresourcedefinitions` (singular→plural map), and single CRD get-by-name | `apiextensions_k8s_io.v1.CustomResourceDefinitions` / `.CustomResourceDefinition(name)` | 

> Note: these list *MCP-cluster* CRDs (managed-resource kinds), so they still require routing —
> the crate CRD list is a different set.

---

## Blocked — MCP-cluster-scoped AND no matching group in the schema ⛔🔴

These need **both** routing **and** new schema exposure (the group is absent from `schema.json`):

| Call site | REST group / resource | Schema status |
|---|---|---|
| `GitRepositories.tsx`, `CreateKustomizationDialog.tsx`, `useCreateGitRepository.ts` | `source.toolkit.fluxcd.io/v1/gitrepositories` (list + POST create) | **Absent.** Only `gitops.open-control-plane.io` (a *different* openmcp abstraction) exists — not the raw Flux CR. |
| `Kustomizations.tsx`, `useCreateKustomization.ts` | `kustomize.toolkit.fluxcd.io/v1/kustomizations` (list + POST create) | **Absent** (same as above). |
| `Landscapers.tsx` | `landscaper.gardener.cloud/v1alpha1/{installations,executions,deployitems}` (per-namespace list, fan-out via `useMultipleApiResources`) | **Absent.** `landscaper_services_open_control_plane_io` is the component-enablement CRD, not these workload resources. |
| `Providers.tsx` | `pkg.crossplane.io/v1/providers` (list) | **Absent.** |
| `ProvidersConfig.tsx`, `useGraph.ts` (`useProvidersConfigResource`) | CRD list → N× `/apis/{group}/{version}/providerconfigs` (N+1 fan-out) | **Absent** — per-provider dynamic groups. A GraphQL field could also collapse the N+1. |
| `ManagedResources.tsx` edit/delete, `useHandleResourcePatch.ts`, `handleResourcePatch.ts` | PATCH / DELETE `/apis/{apiVersion}/[namespaces/{ns}/]{plural}/{name}` (dynamic managed resources) | Dynamic per-CRD groups — absent. `applyYaml` mutation exists but only against crate schema. |

---

## No GraphQL equivalent (aggregate / custom BFF) ⛔🔴

| Call site | REST | Why |
|---|---|---|
| `useKpiCrossplane.ts`, `useKpiFlux.ts`, `HintsCardsRow.tsx`, `ManagedResources.tsx`, `useGraph.ts` | GET `/managed` | **Custom BFF aggregate endpoint**, not a plain k8s list — the single most-reused MCP call. There is no equivalent GraphQL field (`typeByCategory` only returns type *metadata* `{group, kind, scope, version}`). Would need a **new GraphQL aggregate resolver** on the backend. |

This is the highest-value backend ask: one aggregate GraphQL field would unblock the KPIs, the
hints row, the managed-resources table, and the dependency graph at once.

---

## Out of scope (not k8s data / already GraphQL)

- **Already GraphQL — leave alone:** `useKubeconfigQuery` (`GetKubeconfig`), the YAML side-panel `variant="loader"` path (`YamlSidePanelWithGraphqlLoader`), `useDeleteManagedControlPlane`'s `GetMCPsList` refetch, and the entire `src/spaces/onboarding/` space.
- **Non-k8s BFF / auth endpoints (not migration targets):**
  - `headlampKubeconfig.ts` — `/api/headlamp/config`, `/api/headlamp/cluster/{name}` (DELETE), `/api/headlamp-kubeconfig` (POST).
  - `AuthContextMcp.tsx` — `/api/auth/mcp/me`, `/api/auth/mcp/refresh`.
  - `FeedbackButton.tsx`, `ShellBar.tsx` — `/api/feedback` (POST).

---

## Suggested sequencing

1. **Phase 1 — crate-scoped, no backend dependency (this PR-able set):**
   `McpContext` / `ManagedControlPlanePage` / `useMcpComponents` control-plane fetch,
   `ImportMembersDialog`, `EditManagedControlPlaneWizardDataLoader`, `ProjectChooser`,
   `useDeleteManagedControlPlane`. All map to types already in `schema.json`.
2. **Backend ask A — GraphQL MCP routing** (honor `X-mcp`/`X-project`/`X-workspace` headers on
   `/api/graphql`). Unblocks the 🟡 set (configmaps/secrets/namespaces/CRDs) immediately.
3. **Backend ask B — expose MCP workload group schema** (Flux, Kustomize, Landscaper, Crossplane
   providers/providerconfigs). Unblocks the 🔴 group set.
4. **Backend ask C — a GraphQL aggregate resolver** to replace the `/managed` BFF endpoint.

---

## Appendix — REST call → GraphQL feasibility index

Legend: ✅ migratable now · 🟡 blocked on routing only · 🔴 blocked on routing + schema · ⚙️ no equivalent (needs new resolver) · ➖ out of scope

| # | File | Resource / path | Verb | Feasibility |
|---|---|---|---|---|
| 1 | `McpContext.tsx` | `managedcontrolplanes`/`controlplanes` get | GET | ✅ (crate) |
| 2 | `ManagedControlPlanePage.tsx` | `managedcontrolplanes` get | GET | ✅ (crate) |
| 3 | `useMcpComponents.ts` | `managedcontrolplanes` get | GET | ✅ (crate) |
| 4 | `ImportMembersDialog.tsx` | `projects` / `workspaces` get | GET | ✅ (crate) |
| 5 | `EditManagedControlPlaneWizardDataLoader.tsx` | `managedcontrolplanes` get | GET | ✅ (crate) |
| 6 | `ProjectChooser.tsx` | `selfsubjectrulesreviews` | POST | ✅ (crate) |
| 7 | `useDeleteManagedControlPlane.ts` | `managedcontrolplanes` annotate + delete | PATCH + DELETE | ✅ (crate) |
| 8 | `McpConfigMaps.tsx` | `configmaps` list | GET | 🟡 |
| 9 | `McpSecrets.tsx` | `secrets` list | GET | 🟡 |
| 10 | `useNamespaceSelect.ts` | `namespaces` list | GET | 🟡 |
| 11 | `useMcpAuthorizationCheck.ts` | `customresourcedefinitions` (auth probe) | GET | 🟡 |
| 12 | `useResourcePluralNames.ts` (`useCRDItemsMapping`) | `customresourcedefinitions` list | GET | 🟡 |
| 13 | `useCustomResourceDefinitionQuery.ts` | single CRD get | GET | 🟡 |
| 14 | `GitRepositories.tsx` | `source.toolkit.fluxcd.io/gitrepositories` list | GET | 🔴 |
| 15 | `useCreateGitRepository.ts` | `…/gitrepositories` create | POST | 🔴 |
| 16 | `CreateKustomizationDialog.tsx` | `…/gitrepositories` list (dropdown) | GET | 🔴 |
| 17 | `Kustomizations.tsx` | `kustomize.toolkit.fluxcd.io/kustomizations` list | GET | 🔴 |
| 18 | `useCreateKustomization.ts` | `…/kustomizations` create | POST | 🔴 |
| 19 | `Landscapers.tsx` | `landscaper.gardener.cloud/{installations,executions,deployitems}` list | GET (fan-out) | 🔴 |
| 20 | `Providers.tsx` | `pkg.crossplane.io/providers` list | GET | 🔴 |
| 21 | `ProvidersConfig.tsx` / `useGraph.ts` | CRD list → N× `providerconfigs` | GET (N+1) | 🔴 |
| 22 | `ManagedResources.tsx` (delete) | dynamic `{plural}/{name}` | DELETE | 🔴 |
| 23 | `ManagedResources.tsx` (force delete) | dynamic `{plural}/{name}` finalizers | PATCH | 🔴 |
| 24 | `useHandleResourcePatch.ts` / `handleResourcePatch.ts` | dynamic `{plural}/{name}` edit | PATCH | 🔴 |
| 25 | `useKpiCrossplane.ts` | `/managed` aggregate | GET | ⚙️ |
| 26 | `useKpiFlux.ts` | `/managed` aggregate | GET | ⚙️ |
| 27 | `HintsCardsRow.tsx` | `/managed` aggregate | GET | ⚙️ |
| 28 | `ManagedResources.tsx` (list) | `/managed` aggregate | GET | ⚙️ |
| 29 | `useGraph.ts` (managed) | `/managed` aggregate | GET | ⚙️ |
| 30 | `headlampKubeconfig.ts`, `AuthContextMcp.tsx`, `FeedbackButton.tsx`, `ShellBar.tsx` | `/api/headlamp*`, `/api/auth/mcp/*`, `/api/feedback` | — | ➖ |
