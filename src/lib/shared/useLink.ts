import { useFrontendConfig } from '../../context/FrontendConfigContext';

export function useLink() {
  const { documentationBaseUrl, githubBaseUrl } = useFrontendConfig();

  const createLink = (path: string) => `${documentationBaseUrl}${path}`;
  const createGithubLink = (path: string) => `${githubBaseUrl}${path}`;

  return {
    documentationHomepage: createLink('/'),
    gettingStartedGuide: createLink('/docs/managed-control-planes/get-started/get-started-mcp'),
    workspaceCreationGuide: createLink('/docs/managed-control-planes/get-started/get-started-mcp#4-create-workspace'),
    mcpCreationGuide: createLink(
      '/docs/managed-control-planes/get-started/get-started-mcp#5-create-managedcontrolplane',
    ),
    serviceAccoutsGuide: createLink(
      '/docs/managed-control-planes/access/service-accounts#create-and-list-serviceaccounts',
    ),
    githubIssuesSupportTicket: createGithubLink('/support/issues/new'),
  };
}
