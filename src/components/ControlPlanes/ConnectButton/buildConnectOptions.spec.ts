import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildConnectOptions } from './buildConnectOptions';

const reportMock = vi.fn();
vi.mock('../../../lib/telemetry/telemetry.ts', () => ({
  telemetry: () => ({ track: vi.fn(), report: reportMock, breadcrumb: vi.fn(), identify: vi.fn() }),
}));

describe('buildConnectOptions', () => {
  const PROJECT_NAME = 'test-project';
  const WORKSPACE_NAME = 'project-test-project--ws-test-workspace';
  const CONTROL_PLANE_NAME = 'test-mcp';

  const build = (kubeconfig: string | undefined) =>
    buildConnectOptions(kubeconfig, PROJECT_NAME, WORKSPACE_NAME, CONTROL_PLANE_NAME);

  beforeEach(() => {
    reportMock.mockReset();
  });

  it('should correctly parse system IdP (without custom IdPs)', () => {
    // ARRANGE
    const kubeconfig = `
apiVersion: v1
contexts:
- name: context-system
  context:
    user: openmcp
`;

    // ACT
    const options = build(kubeconfig);

    // ASSERT
    expect(options).toHaveLength(1);

    const systemOption = options.find((o) => o.isSystemIdP);
    expect(systemOption).toBeDefined();
    expect(systemOption).toEqual({
      name: 'context-system',
      user: 'openmcp',
      isSystemIdP: true,
      url: '/projects/test-project/workspaces/test-workspace/managedcontrolplane/test-mcp',
    });
  });

  it('should return an empty array when kubeconfig is undefined', () => {
    // ACT & ASSERT
    expect(build(undefined)).toEqual([]);
  });

  it('should return an empty array when kubeconfig is invalid YAML', () => {
    // ARRANGE
    const invalidYaml = 'invalid: yaml: : content';

    // ACT & ASSERT
    expect(build(invalidYaml)).toEqual([]);
  });

  it('should correctly parse system IdP and custom IdPs and sort them correctly', () => {
    // ARRANGE
    const kubeconfig = `
apiVersion: v1
contexts:
- name: context-a
  context:
    user: user-a
- name: context-system
  context:
    user: openmcp
- name: context-b
  context:
    user: user-b
    `;

    // ACT
    const options = build(kubeconfig);

    // ASSERT
    expect(options).toHaveLength(3);

    const systemOption = options.find((o) => o.isSystemIdP);
    expect(systemOption).toBeDefined();
    expect(systemOption).toEqual({
      name: 'context-system',
      user: 'openmcp',
      isSystemIdP: true,
      url: '/projects/test-project/workspaces/test-workspace/managedcontrolplane/test-mcp',
    });

    const customOptions = options.filter((o) => !o.isSystemIdP);
    expect(customOptions).toHaveLength(2);
    expect(customOptions[0].user).toBe('user-a');
    expect(customOptions[0].url).toBe(
      '/projects/test-project/workspaces/test-workspace/managedcontrolplane/test-mcp?idp=user-a',
    );
    expect(customOptions[1].user).toBe('user-b');
    expect(customOptions[1].url).toBe(
      '/projects/test-project/workspaces/test-workspace/managedcontrolplane/test-mcp?idp=user-b',
    );
  });

  it('should handle kubeconfig without system IdP', () => {
    // ARRANGE
    const kubeconfig = `
apiVersion: v1
contexts:
- name: context-custom
  context:
    user: custom-user
    `;

    // ACT
    const options = build(kubeconfig);

    // ASSERT
    expect(options).toHaveLength(1);
    expect(options[0].isSystemIdP).toBe(false);
    expect(options[0].user).toBe('custom-user');
    expect(options[0].url).toBe(
      '/projects/test-project/workspaces/test-workspace/managedcontrolplane/test-mcp?idp=custom-user',
    );
  });

  it('should handle kubeconfig with no contexts gracefully', () => {
    // ARRANGE
    const kubeconfig = `
apiVersion: v1
clusters: []
    `;

    // ACT & ASSERT
    expect(build(kubeconfig)).toEqual([]);
  });
});
