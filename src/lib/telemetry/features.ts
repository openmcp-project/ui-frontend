// Add new tracked features here. Each variant must have a literal `name`
// (the event identifier) and may carry additional context properties.
//
// Property values are restricted to strings for now. Dynatrace's
// `addActionProperties` will need to be adjusted for other types.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type Feature<N extends string, P extends Record<string, string> = {}> = { name: N } & P;

export type TelemetryFeature =
  // Kubeconfig
  | Feature<'kubeconfig.copied'>
  | Feature<'kubeconfig.downloaded'>
  // Control Plane connection
  | Feature<'controlplane.connected', { idp: 'system' | 'custom' }>
  // Projects
  | Feature<'project.created'>
  | Feature<'project.deleted'>
  | Feature<'project.edited'>
  // Workspaces
  | Feature<'workspace.created'>
  | Feature<'workspace.deleted'>
  | Feature<'workspace.edited'>
  // Control Planes
  | Feature<'controlplane.created'>
  | Feature<'controlplane.deleted'>
  | Feature<'controlplane.edited'>
  | Feature<'controlplane.duplicated'>
  // YAML
  | Feature<'yaml.viewed', { resourceType: string }>
  // Members
  | Feature<'member.added', { scope: 'project' | 'workspace' | 'controlplane' }>
  // Components
  | Feature<'component.installed', { componentName: string }>
  | Feature<'component.updated', { componentName: string }>
  | Feature<'component.uninstalled', { componentName: string }>;
