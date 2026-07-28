// Matches project or workspace names: 1-63 chars per segment, alphanum/dash, dot-separated, no leading/trailing dash, allows uppercase.
export const projectWorkspaceNameRegex = /^(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(?:\.(?!-)[a-zA-Z0-9-]{1,63}(?<!-))*$/;

// Matches managed control plane names: 1-63 chars per segment, lowercase alphanum/dash, dot-separated, no leading/trailing dash.
export const managedControlPlaneNameRegex = /^(?!-)[a-z0-9-]{1,63}(?<!-)(?:\.(?!-)[a-z0-9-]{1,63}(?<!-))*$/;

export const btpChargingTargetRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Matches OIDC extra-provider names allowed by the ControlPlane v2alpha1 CRD: lowercase alphanum/dash segments, dot-separated.
export const oidcProviderNameRegex = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;

// Matches OIDC issuer URLs allowed by the ControlPlane v2alpha1 CRD.
export const oidcIssuerUrlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/;
