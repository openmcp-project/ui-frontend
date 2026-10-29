// Add new tracked features here. Each variant must have literal `category` and `action`
// fields (the event identifier) and may carry additional context properties.
//
// Property values are restricted to strings for now. Dynatrace's
// `addActionProperties` will need to be adjusted for other types.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type Feature<C extends string, A extends string, P extends Record<string, string> = {}> = {
  category: C;
  action: A;
} & P;

export type TelemetryFeature =
  // Kubeconfig
  | Feature<
      'kubeconfig',
      'copied',
      { source: 'controlplane-card' | 'controlplane-detail' | 'controlplane-shellbar' | 'controlplane-info-popover' }
    >
  | Feature<
      'kubeconfig',
      'downloaded',
      { source: 'controlplane-card' | 'controlplane-detail' | 'controlplane-shellbar' | 'controlplane-info-popover' }
    >
  // Control Plane connection
  | Feature<'controlplane', 'connected', { idp: 'system' | 'custom' }>
  // Projects
  | Feature<'project', 'created'>
  | Feature<'project', 'deleted', { source: 'list' | 'detail' }>
  | Feature<'project', 'edited', { source: 'list' | 'detail' | 'metadata-popover' | 'support-cta' }>
  | Feature<'project', 'remembered', { source: 'list' | 'detail-header' }>
  | Feature<'project', 'remembered-cleared', { source: 'detail-header' | 'shellbar-menu' }>
  // Project list interactions
  | Feature<'project-list', 'navigated', { trigger: 'click' | 'keyboard' }>
  | Feature<'project-list', 'set-as-default', { trigger: 'click' | 'keyboard' }>
  | Feature<'project-list', 'searched'>
  | Feature<'project-list', 'search-enter-pressed'>
  // Workspace grid search
  | Feature<'workspace-list', 'searched'>
  | Feature<'workspace-list', 'search-enter-pressed'>
  // Workspaces
  | Feature<'workspace', 'created'>
  | Feature<'workspace', 'deleted', { source: 'card' }>
  | Feature<'workspace', 'edited'>
  // Control Planes
  | Feature<'controlplane', 'created', { source: 'v1' | 'v2' }>
  | Feature<'controlplane', 'deleted', { source: 'v1-card' | 'v2-card' }>
  | Feature<'controlplane', 'edited', { source: 'v1' | 'v2' | 'v1-detail' | 'v2-detail' }>
  | Feature<'controlplane', 'duplicated'>
  // YAML
  | Feature<'yaml', 'viewed', { resourceType: string }>
  // Members
  | Feature<'member', 'added', { scope: 'project' | 'workspace' | 'controlplane' }>
  // Components
  | Feature<'component', 'installed', { componentName: string }>
  | Feature<'component', 'updated', { componentName: string }>
  | Feature<'component', 'uninstalled', { componentName: string }>
  | Feature<'component', 'status-viewed', { componentName: string }>
  // Shell bar
  | Feature<'view-mode', 'toggled', { mode: 'headlamp' | 'legacy' }>
  | Feature<'feedback', 'opened'>
  | Feature<'feedback', 'submitted'>
  | Feature<'user', 'signed-out'>
  // Status / readiness
  | Feature<'controlplane', 'status-viewed', { source: 'card' | 'detail' }>
  // Members
  | Feature<
      'members',
      'viewed',
      { source: 'project-list' | 'workspace-grid' | 'controlplane-detail' | 'controlplane-card' }
    >
  // Misc UI
  | Feature<
      'clipboard',
      'copied',
      { source: 'project-namespace' | 'workspace-namespace' | 'controlplane-namespace' | 'other' }
    >
  // YAML Apply Dialog
  // IMPORTANT: MatomoAdapter sends ONLY the first property of each event as the Matomo
  // event `name`; the rest are captured by Dynatrace but dropped by Matomo. The first
  // property below is the load-bearing Matomo dimension — do not reorder without re-checking it.
  | Feature<'yaml-apply', 'dialog-opened', { method: YamlUploadMethod; target: YamlApplyTarget; resourceCount: string }>
  | Feature<'yaml-apply', 'files-added', { method: YamlUploadMethod; addedCount: string }>
  | Feature<'yaml-apply', 'parse-error', { errorType: YamlApplyErrorType }>
  | Feature<'yaml-apply', 'add-files-error', { errorType: YamlApplyErrorType | 'duplicate'; method: YamlUploadMethod }>
  | Feature<
      'yaml-apply',
      'resource-applied',
      { kind: string; target: YamlApplyTarget; source: YamlApplySource; mode?: 'create' | 'overwrite' }
    >
  | Feature<'yaml-apply', 'resource-apply-failed', { kind: string; target: YamlApplyTarget; source: YamlApplySource }>
  | Feature<'yaml-apply', 'dry-run', { result: 'ok' | 'error'; kind: string; target: YamlApplyTarget }>
  | Feature<'yaml-apply', 'resource-removed', { kind: string }>
  | Feature<'yaml-apply', 'dialog-closed', { outcome: YamlApplyOutcome; appliedCount: string }>;

export type YamlUploadMethod = 'drag-and-drop' | 'file-picker';
export type YamlApplyTarget = 'controlplane' | 'onboarding';
export type YamlApplySource = 'single' | 'apply-all';
export type YamlApplyErrorType = 'wrong-file-type' | 'empty-file' | 'missing-fields' | 'parse-error';
export type YamlApplyOutcome = 'all-applied' | 'partial' | 'none-applied' | 'abandoned' | 'parse-failed';
