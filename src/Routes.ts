export const Routes = {
  Home: '/',
  Projects: '/projects',
  Project: '/projects/:projectName',
  Mcp: '/projects/:projectName/workspaces/:workspaceName/managedcontrolplane/:controlPlaneName',
  McpV2: '/projects/:projectName/workspaces/:workspaceName/controlplane/:controlPlaneName',
} as const;
