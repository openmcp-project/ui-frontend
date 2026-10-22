export const Routes = {
  Home: '/',
  Projects: '/projects',
  Project: '/projects/:projectName',
  Mcp: '/projects/:projectName/workspaces/:workspaceName/managedcontrolplane/:controlPlaneName',
  McpV2: '/projects/:projectName/workspaces/:workspaceName/controlplane/:controlPlaneName',
  McpV2Headlamp: '/projects/:projectName/workspaces/:workspaceName/controlplane/:controlPlaneName/headlamp',
} as const;

export const SearchParams = {
  View: 'view',
  HeadlampPath: 'headlampPath',
} as const;
