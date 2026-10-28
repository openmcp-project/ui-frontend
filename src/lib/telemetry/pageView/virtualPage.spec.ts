import { describe, expect, it } from 'vitest';
import { toVirtualPage } from './virtualPage';

const MCP_V1 = '/projects/webapp-playground/workspaces/development/managedcontrolplane/playground-mcp-01';
const MCP_V2 = '/projects/webapp-playground/workspaces/development/controlplane/playground-mcp-01';
const MCP_V1_PATTERN = '/projects/:projectName/workspaces/:workspaceName/managedcontrolplane/:controlPlaneName';
const MCP_V2_PATTERN = '/projects/:projectName/workspaces/:workspaceName/controlplane/:controlPlaneName';
const RESOURCE_NAMES = ['webapp-playground', 'development', 'playground-mcp-01', 'provider-certservice', 'my-pod'];

const headlamp = (headlampPath: string) =>
  `?tab=landscaper&view=open-source&headlampPath=${encodeURIComponent(headlampPath)}`;

describe('toVirtualPage', () => {
  describe('legacy view', () => {
    it.each([
      ['/', '', '/'],
      ['/projects', '', '/projects'],
      ['/projects/webapp-playground', '', '/projects/:projectName'],
      [MCP_V1, '', MCP_V1_PATTERN],
      [MCP_V1, '?tab=crossplane', MCP_V1_PATTERN],
      [MCP_V2, '?tab=landscaper', MCP_V2_PATTERN],
    ])('%s%s → %s', (pathname, search, expected) => {
      expect(toVirtualPage(pathname, search)).toBe(expected);
    });

    it('ignores a stale headlampPath when ?view is absent', () => {
      const search = `?tab=landscaper&headlampPath=${encodeURIComponent('/crossplane/crds')}`;
      expect(toVirtualPage(MCP_V1, search)).toBe(MCP_V1_PATTERN);
    });

    it('ignores headlampPath when ?view is not open-source', () => {
      const search = `?view=beginner&headlampPath=${encodeURIComponent('/crossplane/crds')}`;
      expect(toVirtualPage(MCP_V2, search)).toBe(MCP_V2_PATTERN);
    });

    it('drops query parameters such as OIDC callback params', () => {
      expect(toVirtualPage('/projects', '?code=abc&state=xyz&iss=https%3A%2F%2Fidp')).toBe('/projects');
    });
  });

  describe('headlamp view', () => {
    it.each([
      ['/ocp/overview', '/headlamp/ocp'],
      ['/crossplane/overview', '/headlamp/crossplane'],
      ['/flux/overview', '/headlamp/flux'],
      ['/map', '/headlamp/map'],
      ['/workloads', '/headlamp/workloads'],
      ['/crossplane/providers/provider-certservice', '/headlamp/crossplane'],
      ['/crossplane/resources', '/headlamp/crossplane'],
      ['/crossplane/crds', '/headlamp/crossplane'],
      ['/pods/project-webapp-playground--ws-development/my-pod', '/headlamp/pods'],
    ])('headlampPath %s → <host pattern>%s', (headlampPath, expectedSuffix) => {
      expect(toVirtualPage(MCP_V1, headlamp(headlampPath))).toBe(MCP_V1_PATTERN + expectedSuffix);
      expect(toVirtualPage(MCP_V2, headlamp(headlampPath))).toBe(MCP_V2_PATTERN + expectedSuffix);
    });

    it('reports bare /headlamp before the first poll has set headlampPath', () => {
      expect(toVirtualPage(MCP_V2, '?view=open-source')).toBe(`${MCP_V2_PATTERN}/headlamp`);
    });

    it('reports bare /headlamp for the Headlamp root path', () => {
      expect(toVirtualPage(MCP_V2, headlamp('/'))).toBe(`${MCP_V2_PATTERN}/headlamp`);
    });

    it('strips an unsanitised proxy prefix from headlampPath', () => {
      const proxied = '/api/headlamp/c/webapp-playground--development--playground-mcp-01/crossplane/crds';
      expect(toVirtualPage(MCP_V2, headlamp(proxied))).toBe(`${MCP_V2_PATTERN}/headlamp/crossplane`);
    });

    it('ignores query and hash inside headlampPath', () => {
      expect(toVirtualPage(MCP_V2, headlamp('/flux?name=my-pod#top'))).toBe(`${MCP_V2_PATTERN}/headlamp/flux`);
    });

    it('reports the standalone Headlamp page by its route pattern', () => {
      expect(toVirtualPage(`${MCP_V2}/headlamp`, '')).toBe(`${MCP_V2_PATTERN}/headlamp`);
    });
  });

  describe('unknown routes', () => {
    it.each([['/foo/bar'], ['/mcp/projects/webapp-playground'], [`${MCP_V1}/extra`]])('%s → /other', (pathname) => {
      expect(toVirtualPage(pathname, '')).toBe('/other');
    });
  });

  describe('privacy', () => {
    it.each([
      ['/projects/webapp-playground', ''],
      [MCP_V1, '?tab=crossplane'],
      [MCP_V2, headlamp('/crossplane/providers/provider-certservice')],
      [MCP_V2, headlamp('/pods/project-webapp-playground--ws-development/my-pod')],
      [`${MCP_V2}/headlamp`, ''],
      ['/mcp/projects/webapp-playground/workspaces/development/mcps/playground-mcp-01', ''],
    ])('never leaks resource names for %s%s', (pathname, search) => {
      const page = toVirtualPage(pathname, search);
      for (const name of RESOURCE_NAMES) expect(page).not.toContain(name);
    });
  });
});
