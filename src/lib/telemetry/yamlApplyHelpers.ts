// Telemetry helpers for the YAML Apply Dialog.

// Known platform kinds safe to report verbatim. Any kind outside this set — including
// user-defined CRDs whose names may embed business identifiers — is reported as "custom".
export const TRACKED_KINDS: ReadonlySet<string> = new Set([
  // Onboarding / platform resources
  'ControlPlane',
  'ManagedControlPlane',
  'Project',
  'Workspace',
  // Flux
  'GitRepository',
  'Kustomization',
  // Kubernetes core
  'ConfigMap',
  'Namespace',
  'Secret',
  // Landscaper
  'DeployItem',
  'Execution',
  'Installation',
  // Crossplane
  'Crossplane',
  'CustomResourceDefinition',
  'Provider',
  // RBAC
  'ClusterRole',
  'Role',
  // Managed / SAP-specific resources shown in graph
  'Entitlement',
  'KymaEnvironment',
  'KymaModule',
  'Object',
  'ServiceInstance',
  'Subaccount',
  // K8s meta
  'List',
]);

/** Returns the kind unchanged when it is a known platform kind, otherwise the opaque "custom". */
export function sanitizeKind(raw: string): string {
  return TRACKED_KINDS.has(raw) ? raw : 'custom';
}
