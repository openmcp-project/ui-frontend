import { useFrontendConfig } from '../../context/FrontendConfigContext';

export function useLink() {
  const { documentationBaseUrl, githubBaseUrl } = useFrontendConfig();

  const createLink = (path: string) => `${documentationBaseUrl}${path}`;
  const createGithubLink = (path: string) => `${githubBaseUrl}${path}`;

  return {
    documentationHomepage: createLink('/'),
    gettingStartedGuide: createLink('/docs/managed-control-planes/get-started/get-started-mcp'),
    workspaceCreationGuide: createLink('/docs/managed-control-planes/get-started/get-started-mcp#4-create-workspace'),
    mcpCreationGuide: createLink('/docs/managed-control-planes/get-started/onboard/get-started-mcp'),
    serviceAccoutsGuide: createLink(
      '/docs/managed-control-planes/access/service-accounts#create-and-list-serviceaccounts',
    ),
    identityProviderGuide: createLink('/operators/quickstart#configure-an-identity-provider'),
    projectsGuide: createLink('/users/concepts/projects-and-workspaces/'),
    githubIssuesSupportTicket: createGithubLink('/support/issues/new'),
    contributeLink: githubBaseUrl,
  };
}
