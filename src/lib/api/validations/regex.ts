// Matches project or workspace names: 1-63 chars per segment, alphanum/dash, dot-separated, no leading/trailing dash, allows uppercase.
export const projectWorkspaceNameRegex =
  /^(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(?:\.(?!-)[a-zA-Z0-9-]{1,63}(?<!-))*$/;

// Matches managed control plane names: 1-63 chars per segment, lowercase alphanum/dash, dot-separated, no leading/trailing dash.
export const managedControlPlaneNameRegex =
  /^(?!-)[a-z0-9-]{1,63}(?<!-)(?:\.(?!-)[a-z0-9-]{1,63}(?<!-))*$/;
