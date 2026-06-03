# Component Delete Feature — Implementation Spec

This document describes how the delete button and confirmation flow is implemented for each MCP component in `ComponentsDashboardV2`.

---

## Overview

When a component is installed, a delete button (`sap-icon://delete`) appears next to the edit button in the `ComponentCard`. Clicking it opens a shared `DeleteConfirmationDialog`. After the user types the component name to confirm, the corresponding GraphQL mutation is called via a dedicated hook.

---

## Files Changed / Created

| File | Change |
|------|--------|
| `src/spaces/mcp/components/ComponentCard/ComponentCard.tsx` | Added `onDeleteButtonClick?: () => void` prop; renders delete button when provided |
| `src/spaces/mcp/components/ComponentsDashboard/ComponentsDashboardV2.tsx` | Imports delete hooks; manages `deleteTarget` state; wires `DeleteConfirmationDialog` |
| `public/locales/en.json` | Added `ComponentCard.deleteButton`, `deleteSuccessMessage`, `deleteErrorMessage` keys |
| `src/spaces/mcp/hooks/useDeleteCrossplane.ts` | New hook |
| `src/spaces/mcp/hooks/useDeleteFlux.ts` | New hook |
| `src/spaces/mcp/hooks/useDeleteLandscaper.ts` | New hook |
| `src/spaces/mcp/hooks/useDeleteEso.ts` | New hook |

---

## Per-Resource Implementation

### Crossplane

**Hook:** `useDeleteCrossplane`

**GraphQL mutation:**
```graphql
mutation DeleteCrossplane($name: String!, $namespace: String) {
  crossplane_services_openmcp_cloud {
    v1alpha1 {
      deleteCrossplane(name: $name, namespace: $namespace)
    }
  }
}
```

- `refetchQueries: ['GetCrossplane']`
- `name` = `mcpName`, `namespace` = `mcpNamespace`
- Dialog confirmation text: `"Crossplane"`

---

### Flux

**Hook:** `useDeleteFlux`

**GraphQL mutation:**
```graphql
mutation DeleteFlux($name: String!, $namespace: String) {
  flux_services_openmcp_cloud {
    v1alpha1 {
      deleteFlux(name: $name, namespace: $namespace)
    }
  }
}
```

- `refetchQueries: ['GetFlux']`
- `name` = `mcpName`, `namespace` = `mcpNamespace`
- Dialog confirmation text: `"Flux"`

---

### Landscaper

**Hook:** `useDeleteLandscaper`

**GraphQL mutation:**
```graphql
mutation DeleteLandscaper($name: String!, $namespace: String) {
  landscaper_services_openmcp_cloud {
    v1alpha2 {
      deleteLandscaper(name: $name, namespace: $namespace)
    }
  }
}
```

- `refetchQueries: ['GetLandscaper']`
- `name` = `mcpName`, `namespace` = `mcpNamespace`
- Dialog confirmation text: `"Landscaper"`

---

### External Secrets Operator (ESO)

**Hook:** `useDeleteEso`

**GraphQL mutation:**
```graphql
mutation DeleteExternalSecretsOperator($name: String!, $namespace: String) {
  external_secrets_services_openmcp_cloud {
    v1alpha1 {
      deleteExternalSecretsOperator(name: $name, namespace: $namespace)
    }
  }
}
```

- `refetchQueries: ['GetExternalSecretsOperator']`
- `name` = `mcpName`, `namespace` = `mcpNamespace`
- Dialog confirmation text: `"External Secrets Operator"`

---

## Confirmation Dialog

Reuses `src/components/Dialogs/DeleteConfirmationDialog.tsx`.

- `resourceName` is set to the component display name (e.g. `"Flux"`).
- The user must type the exact component name to enable the Delete button.
- On confirm: calls the hook's delete function, then shows a toast via `ComponentCard.deleteSuccessMessage`.
- On error: logs to console and shows `ComponentCard.deleteErrorMessage` toast.
- The delete button is only rendered when the component is installed (`isInstalled === true`).

---

## Hook Pattern

All four hooks follow the same shape:

```ts
export function useDeleteX() {
  const [deleteMutation, { loading, error }] = useMutation(DeleteXMutation, {
    refetchQueries: ['GetX'],
  });

  const deleteX = useCallback(
    async (variables: { namespace: string; name: string }) => {
      return deleteMutation({ variables });
    },
    [deleteMutation],
  );

  return { deleteX, loading, error };
}
```

To add delete support for a new component:
1. Add a `useDeleteY.ts` hook following this pattern.
2. Add the component key to the `DELETE_TARGET_COMPONENT_NAME` map and `DeleteTarget` union type in `ComponentsDashboardV2.tsx`.
3. Call the hook in the dashboard, add a branch in `handleDeleteConfirmed`, and pass `onDeleteButtonClick` to the card.
