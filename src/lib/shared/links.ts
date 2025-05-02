import { useFrontendConfig } from '../../context/FrontendConfigContext';

export function useLink() {
  const { documentationBaseUrl, githubBaseUrl } = useFrontendConfig();

  if (!documentationBaseUrl || !githubBaseUrl) {
    throw new Error('useLink must be used within a FrontendConfigProvider');
  }
  const createLink = (path: string) => `${documentationBaseUrl}${path}`;
  const createGithubLink = (path: string) => `${githubBaseUrl}${path}`;

  return {
    documentationHomepage: createLink('/'),
    gettingStartedGuide: createLink(
      '/docs/managed-control-planes/get-started/get-started-mcp',
    ),
    workspaceCreationGuide: createLink(
      '/docs/managed-control-planes/get-started/get-started-mcp#4-create-workspace',
    ),
    mcpCreationGuide: createLink(
      '/docs/managed-control-planes/get-started/get-started-mcp#5-create-managedcontrolplane',
    ),
    githubIssuesSupportTicket: createGithubLink('/support/issues/new'),
  };
}
