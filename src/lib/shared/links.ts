export class DocLinkCreator {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  private createLink(path: string) {
    return `${this.baseUrl}${path}`;
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
  public get COM_PAGE_SUPPORT_ISSUE(): string {
    return this.createLink('/support/issues/new');
  }
}
