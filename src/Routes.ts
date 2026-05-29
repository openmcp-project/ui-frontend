export const Routes = {
  Home: '/',
  Projects: '/mcp/projects',
  Project: '/mcp/projects/:projectName',
  Mcp: '/mcp/projects/:projectName/workspaces/:workspaceName/mcps/:controlPlaneName',
} as const;
