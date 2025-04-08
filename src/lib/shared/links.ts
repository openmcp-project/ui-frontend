export class LinkCreator {
  private baseUrl: string;
  private githubBaseUrl: string;

  constructor(baseUrl: string, githubBaseUrl: string) {
    this.baseUrl = baseUrl;
    this.githubBaseUrl = githubBaseUrl;
  }
  private createLink(path: string) {
    return `${this.baseUrl}${path}`;
  }

  private createGithubLink(path: string) {
    return `${this.githubBaseUrl}${path}`;
  }

  public get COMMUNITY_PAGE(): string {
    return this.createLink('/');
  }
  public get COM_PAGE_GETTING_STARTED(): string {
    return this.createLink(
      '/docs/managed-control-planes/get-started/get-started-mcp',
    );
  }
  public get COM_PAGE_GETTING_STARTED_WORKSPACE(): string {
    return this.createLink(
      '/docs/managed-control-planes/get-started/get-started-mcp#4-create-workspace',
    );
  }
  public get COM_PAGE_GETTING_STARTED_MCP(): string {
    return this.createLink(
      '/docs/managed-control-planes/get-started/get-started-mcp#5-create-managedcontrolplane',
    );
  }
  public get COM_PAGE_SUPPORT_GITHUB_ISSUE(): string {
    return this.createGithubLink('/support/issues/new');
  }
}
