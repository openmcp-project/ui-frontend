// Telemetry helpers for the YAML Apply Dialog. See docs/yaml-apply-analytics-plan.md.

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

/** Buckets a raw count into a coarse band so precise batch sizes are never exposed. */
export function bucketCount(n: number): string {
  if (n <= 1) return '1';
  if (n === 2) return '2';
  if (n <= 5) return '3-5';
  if (n <= 10) return '6-10';
  return '10+';
}
