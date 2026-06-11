// Add new tracked features here. Each variant must have a literal `name`
// (the event identifier) and may carry additional context properties.
//
// Property values are restricted to strings for now. Dynatrace's
// `addActionProperties` will need to be adjusted for other types.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type Feature<N extends string, P extends Record<string, string> = {}> = { name: N } & P;

export type TelemetryFeature =
  | Feature<'kubeconfig.copied'>
  | Feature<'kubeconfig.downloaded'>
  | Feature<'mcp.connected', { idp: 'system' | 'custom' }>;
