export const Routes = {
  Home: '/',
  Projects: '/projects',
  Project: '/projects/:projectName',
  Mcp: '/projects/:projectName/workspaces/:workspaceName/managedcontrolplane/:controlPlaneName',
} as const;
