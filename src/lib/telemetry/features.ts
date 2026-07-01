// Add new tracked features here. Each variant must have a literal `name`
// (the event identifier) and may carry additional context properties.
//
// Property values are restricted to strings for now. Dynatrace's
// `addActionProperties` will need to be adjusted for other types.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type Feature<N extends string, P extends Record<string, string> = {}> = { name: N } & P;

export type TelemetryFeature =
  // Kubeconfig
  | Feature<'kubeconfig.copied', { source: 'controlplane-card' | 'controlplane-detail' | 'controlplane-shellbar' }>
  | Feature<'kubeconfig.downloaded', { source: 'controlplane-card' | 'controlplane-detail' | 'controlplane-shellbar' }>
  // Control Plane connection
  | Feature<'controlplane.connected', { idp: 'system' | 'custom' }>
  // Projects
  | Feature<'project.created'>
  | Feature<'project.deleted', { source: 'list' | 'detail' }>
  | Feature<'project.edited', { source: 'list' | 'detail' | 'metadata-popover' }>
  | Feature<'project.remembered', { source: 'list' | 'detail-header' }>
  | Feature<'project.remembered-cleared', { source: 'detail-header' | 'shellbar-menu' }>
  // Project list interactions
  | Feature<'project-list.navigated', { trigger: 'click' | 'keyboard' }>
  | Feature<'project-list.set-as-default', { trigger: 'click' | 'keyboard' }>
  | Feature<'project-list.search-enter-pressed'>
  // Workspaces
  | Feature<'workspace.created'>
  | Feature<'workspace.deleted', { source: 'card' }>
  | Feature<'workspace.edited'>
  // Control Planes
  | Feature<'controlplane.created', { source: 'v1' | 'v2' }>
  | Feature<'controlplane.deleted', { source: 'v1-card' | 'v2-card' }>
  | Feature<'controlplane.edited', { source: 'v1' | 'v2' | 'v1-detail' | 'v2-detail' }>
  | Feature<'controlplane.duplicated'>
  // YAML
  | Feature<'yaml.viewed', { resourceType: string }>
  // Members
  | Feature<'member.added', { scope: 'project' | 'workspace' | 'controlplane' }>
  // Components
  | Feature<'component.installed', { componentName: string }>
  | Feature<'component.updated', { componentName: string }>
  | Feature<'component.uninstalled', { componentName: string }>
  // Shell bar
  | Feature<'view-mode.toggled', { mode: 'headlamp' | 'legacy' }>
  | Feature<'feedback.opened'>
  | Feature<'feedback.submitted'>
  | Feature<'user.signed-out'>
  // Status / readiness
  | Feature<'controlplane.status-viewed', { source: 'card' | 'detail' }>
  // Members
  | Feature<'members.viewed', { source: 'project-list' | 'workspace-grid' | 'controlplane-detail' }>
  // Misc UI
  | Feature<
      'clipboard.copied',
      { source: 'project-namespace' | 'workspace-namespace' | 'controlplane-namespace' | 'other' }
    >;
