import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useConnectOptions } from './useConnectOptions';

describe('useConnectOptions', () => {
  const PROJECT_NAME = 'test-project';
  const WORKSPACE_NAME = 'project-test-project--ws-test-workspace';
  const CONTROL_PLANE_NAME = 'test-mcp';

  const renderTestHook = (kubeconfig: string | undefined) =>
    renderHook(() => useConnectOptions(kubeconfig, PROJECT_NAME, WORKSPACE_NAME, CONTROL_PLANE_NAME));

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
    const { result } = renderTestHook(kubeconfig);

    const options = result.current;

    // ASSERT
    expect(options).toHaveLength(1);

    const systemOption = options.find((o) => o.isSystemIdP);
    expect(systemOption).toBeDefined();
    expect(systemOption).toEqual({
      name: 'context-system',
      user: 'openmcp',
      isSystemIdP: true,
      url: '/mcp/projects/test-project/workspaces/test-workspace/mcps/test-mcp',
    });
  });

  it('should return an empty array when kubeconfig is undefined', () => {
    // ACT
    const { result } = renderTestHook(undefined);

    // ASSERT
    expect(result.current).toEqual([]);
  });

  it('should return an empty array when kubeconfig is invalid YAML', () => {
    // ARRANGE
    const invalidYaml = 'invalid: yaml: : content';

    // ACT
    const { result } = renderTestHook(invalidYaml);

    // ASSERT
    expect(result.current).toEqual([]);
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
    const { result } = renderTestHook(kubeconfig);

    const options = result.current;

    // ASSERT
    expect(options).toHaveLength(3);

    const systemOption = options.find((o) => o.isSystemIdP);
    expect(systemOption).toBeDefined();
    expect(systemOption).toEqual({
      name: 'context-system',
      user: 'openmcp',
      isSystemIdP: true,
      url: '/mcp/projects/test-project/workspaces/test-workspace/mcps/test-mcp',
    });

    const customOptions = options.filter((o) => !o.isSystemIdP);
    expect(customOptions).toHaveLength(2);
    expect(customOptions[0].user).toBe('user-a');
    expect(customOptions[0].url).toBe('/mcp/projects/test-project/workspaces/test-workspace/mcps/test-mcp?idp=user-a');
    expect(customOptions[1].user).toBe('user-b');
    expect(customOptions[1].url).toBe('/mcp/projects/test-project/workspaces/test-workspace/mcps/test-mcp?idp=user-b');
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
    const { result } = renderTestHook(kubeconfig);

    // ASSERT
    expect(result.current).toHaveLength(1);
    expect(result.current[0].isSystemIdP).toBe(false);
    expect(result.current[0].user).toBe('custom-user');
    expect(result.current[0].url).toBe(
      '/mcp/projects/test-project/workspaces/test-workspace/mcps/test-mcp?idp=custom-user',
    );
  });

  it('should handle kubeconfig with no contexts gracefully', () => {
    // ARRANGE
    const kubeconfig = `
apiVersion: v1
clusters: []
    `;

    // ACT
    const { result } = renderTestHook(kubeconfig);

    // ASSERT
    expect(result.current).toEqual([]);
  });
});
