import { describe, expect, it, vi } from 'vitest';

import {
  applyCpResource,
  applyOnboardingResource,
  checkOnboardingResourceExists,
  isOnboardingKind,
  parseYamlDocuments,
  supportsOnboardingDryRun,
  validateYamlFile,
} from './useYamlApplyResource';
import type { MultiDocResult, ParsedResource, ValidationResult } from './useYamlApplyResource';
import type { ApolloClient } from '@apollo/client';
import type { ApiConfig } from '../lib/api/types/apiConfig';
import { fetchApiServerJson } from '../lib/api/fetch';

vi.mock('../lib/api/fetch', () => ({
  fetchApiServerJson: vi.fn().mockResolvedValue({}),
}));

const workspaceYaml = `apiVersion: core.openmcp.cloud/v1alpha1
kind: Workspace
metadata:
  name: my-workspace
  namespace: my-project
`;

const projectYaml = `apiVersion: core.openmcp.cloud/v1alpha1
kind: Project
metadata:
  name: my-project
`;

function assertValid<T extends { valid: true }>(result: { valid: boolean }): asserts result is T {
  if (!result.valid) throw new Error('expected a valid result');
}

function assertInvalid<T extends { valid: false }>(result: { valid: boolean }): asserts result is T {
  if (result.valid) throw new Error('expected an invalid result');
}

describe('validateYamlFile', () => {
  it('accepts a structurally valid single-document resource', () => {
    const result: ValidationResult = validateYamlFile('workspace.yaml', workspaceYaml);
    assertValid(result);
    expect(result.resource.kind).toBe('Workspace');
    expect(result.resource.metadata.name).toBe('my-workspace');
  });

  it('accepts a .yml extension', () => {
    expect(validateYamlFile('workspace.yml', workspaceYaml).valid).toBe(true);
  });

  it('rejects a non-YAML file extension', () => {
    const result: ValidationResult = validateYamlFile('workspace.txt', workspaceYaml);
    assertInvalid(result);
    expect(result.error).toBe('wrong-file-type');
  });

  it('rejects unparseable YAML', () => {
    const result: ValidationResult = validateYamlFile('bad.yaml', 'foo: [unclosed');
    assertInvalid(result);
    expect(result.error).toBe('parse-error');
  });

  it('rejects a document missing required fields', () => {
    const result: ValidationResult = validateYamlFile('incomplete.yaml', 'apiVersion: v1\nkind: ConfigMap\n');
    assertInvalid(result);
    expect(result.error).toBe('missing-fields');
  });
});

describe('parseYamlDocuments', () => {
  it('parses a single document into one resource', () => {
    const result: MultiDocResult = parseYamlDocuments('project.yaml', projectYaml);
    assertValid(result);
    expect(result.resources).toHaveLength(1);
    expect(result.resources[0].kind).toBe('Project');
  });

  it('parses a multi-document file into multiple resources', () => {
    const multi = `${projectYaml}---\n${workspaceYaml}`;
    const result: MultiDocResult = parseYamlDocuments('multi.yaml', multi);
    assertValid(result);
    expect(result.resources.map((r) => r.kind)).toEqual(['Project', 'Workspace']);
  });

  it('skips empty documents from leading/trailing separators', () => {
    const withBlanks = `---\n${projectYaml}---\n---\n${workspaceYaml}---\n`;
    const result: MultiDocResult = parseYamlDocuments('multi.yaml', withBlanks);
    assertValid(result);
    expect(result.resources).toHaveLength(2);
  });

  it('rejects a non-YAML file extension', () => {
    const result: MultiDocResult = parseYamlDocuments('resources.json', projectYaml);
    assertInvalid(result);
    expect(result.error).toBe('wrong-file-type');
  });

  it('fails on the first document that is missing required fields', () => {
    const multi = `${projectYaml}---\napiVersion: v1\nkind: ConfigMap\n`;
    const result: MultiDocResult = parseYamlDocuments('multi.yaml', multi);
    assertInvalid(result);
    expect(result.error).toBe('missing-fields');
  });

  it('reports a parse error for malformed YAML', () => {
    const result: MultiDocResult = parseYamlDocuments('bad.yaml', 'foo: [unclosed');
    assertInvalid(result);
    expect(result.error).toBe('parse-error');
  });

  it('reports an empty file when no documents contain content', () => {
    const result: MultiDocResult = parseYamlDocuments('empty.yaml', '---\n---\n');
    assertInvalid(result);
    expect(result.error).toBe('empty-file');
  });
});

describe('isOnboardingKind', () => {
  it('accepts the four management-plane kinds', () => {
    for (const kind of ['Project', 'Workspace', 'ControlPlane', 'ManagedControlPlane']) {
      expect(isOnboardingKind(kind)).toBe(true);
    }
  });

  it('rejects any other kind', () => {
    expect(isOnboardingKind('Provider')).toBe(false);
    expect(isOnboardingKind('ConfigMap')).toBe(false);
  });
});

const controlPlane: ParsedResource = {
  apiVersion: 'core.openmcp.cloud/v2alpha1',
  kind: 'ControlPlane',
  metadata: { name: 'my-cp', namespace: 'project-p--ws-w' },
  spec: { foo: 'bar' },
};

const managedControlPlane: ParsedResource = {
  apiVersion: 'core.openmcp.cloud/v1alpha1',
  kind: 'ManagedControlPlane',
  metadata: { name: 'my-mcp', namespace: 'p--ws-w' },
  spec: { components: {} },
};

describe('checkOnboardingResourceExists', () => {
  it('returns true when the ControlPlane (v2) is found', async () => {
    const client = {
      query: vi.fn().mockResolvedValue({
        data: { core_open_control_plane_io: { v2alpha1: { ControlPlane: { metadata: { name: 'my-cp' } } } } },
      }),
    } as unknown as ApolloClient;
    expect(await checkOnboardingResourceExists(controlPlane, client)).toBe(true);
  });

  it('returns false when the ControlPlane (v2) is absent', async () => {
    const client = {
      query: vi.fn().mockResolvedValue({ data: { core_open_control_plane_io: { v2alpha1: { ControlPlane: null } } } }),
    } as unknown as ApolloClient;
    expect(await checkOnboardingResourceExists(controlPlane, client)).toBe(false);
  });

  it('returns true when the ManagedControlPlane (v1) is found', async () => {
    const client = {
      query: vi.fn().mockResolvedValue({
        data: { core_openmcp_cloud: { v1alpha1: { ManagedControlPlane: { metadata: { name: 'my-mcp' } } } } },
      }),
    } as unknown as ApolloClient;
    expect(await checkOnboardingResourceExists(managedControlPlane, client)).toBe(true);
  });
});

describe('applyOnboardingResource', () => {
  it('creates a ControlPlane (v2) when it does not exist', async () => {
    const mutate = vi.fn().mockResolvedValue({ data: {} });
    const client = { mutate } as unknown as ApolloClient;
    const result = await applyOnboardingResource(controlPlane, false, client);
    expect(result.success).toBe(true);
    const call = mutate.mock.calls[0][0];
    expect(call.variables).toMatchObject({ namespace: 'project-p--ws-w' });
    expect(call.variables.name).toBeUndefined();
    expect(call.variables.object.status).toBeUndefined();
    expect(call.variables.object).toMatchObject({ kind: 'ControlPlane', spec: { foo: 'bar' } });
  });

  it('updates a ControlPlane (v2) when it already exists', async () => {
    const mutate = vi.fn().mockResolvedValue({ data: {} });
    const client = { mutate } as unknown as ApolloClient;
    await applyOnboardingResource(controlPlane, true, client);
    expect(mutate.mock.calls[0][0].variables).toMatchObject({ name: 'my-cp', namespace: 'project-p--ws-w' });
  });

  it('creates a ManagedControlPlane (v1) when it does not exist', async () => {
    const mutate = vi.fn().mockResolvedValue({ data: {} });
    const client = { mutate } as unknown as ApolloClient;
    await applyOnboardingResource(managedControlPlane, false, client);
    const call = mutate.mock.calls[0][0];
    expect(call.variables).toMatchObject({ namespace: 'p--ws-w' });
    expect(call.variables.name).toBeUndefined();
  });

  it('updates a ManagedControlPlane (v1) when it already exists', async () => {
    const mutate = vi.fn().mockResolvedValue({ data: {} });
    const client = { mutate } as unknown as ApolloClient;
    await applyOnboardingResource(managedControlPlane, true, client);
    expect(mutate.mock.calls[0][0].variables).toMatchObject({ name: 'my-mcp', namespace: 'p--ws-w' });
  });
});

describe('dry run', () => {
  it('supportsOnboardingDryRun is true only for ControlPlane (v2)', () => {
    expect(supportsOnboardingDryRun('ControlPlane')).toBe(true);
    expect(supportsOnboardingDryRun('ManagedControlPlane')).toBe(false);
    expect(supportsOnboardingDryRun('Workspace')).toBe(false);
    expect(supportsOnboardingDryRun('Project')).toBe(false);
  });

  it('passes dryRun to the ControlPlane (v2) mutation and skips refetchQueries', async () => {
    const mutate = vi.fn().mockResolvedValue({ data: {} });
    const client = { mutate } as unknown as ApolloClient;
    await applyOnboardingResource(controlPlane, false, client, true);
    const call = mutate.mock.calls[0][0];
    expect(call.variables).toMatchObject({ dryRun: true });
    expect(call.refetchQueries).toBeUndefined();
  });

  it('refuses a dry run for a kind the Onboarding API cannot dry-run', async () => {
    const mutate = vi.fn();
    const client = { mutate } as unknown as ApolloClient;
    await expect(applyOnboardingResource(managedControlPlane, false, client, true)).rejects.toThrow();
    expect(mutate).not.toHaveBeenCalled();
  });

  it('appends ?dryRun=All to the Control Plane server-side apply path', async () => {
    const apiConfig = {} as ApiConfig;
    await applyCpResource(controlPlane, 'controlplanes', apiConfig, true);
    const url = vi.mocked(fetchApiServerJson).mock.calls.at(-1)?.[0] as string;
    expect(url).toContain('dryRun=All');
  });

  it('does not append dryRun on a normal Control Plane apply', async () => {
    const apiConfig = {} as ApiConfig;
    await applyCpResource(controlPlane, 'controlplanes', apiConfig);
    const url = vi.mocked(fetchApiServerJson).mock.calls.at(-1)?.[0] as string;
    expect(url).not.toContain('dryRun');
  });
});
