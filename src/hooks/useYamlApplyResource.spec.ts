import { describe, expect, it, vi } from 'vitest';

import {
  applyCpResource,
  applyOnboardingResource,
  checkCpResourceExists,
  checkOnboardingResourceExists,
  dedupeResources,
  isOnboardingKind,
  nextIndexAfterRemove,
  parseYamlDocuments,
  resourceIdentity,
  resolveCpResourcePlural,
  supportsOnboardingDryRun,
  validateYamlFile,
} from './useYamlApplyResource';
import type { MultiDocResult, ParsedResource, ValidationResult } from './useYamlApplyResource';
import type { ApolloClient } from '@apollo/client';
import type { ApiConfig } from '../lib/api/types/apiConfig';
import { fetchApiServerJson } from '../lib/api/fetch';
import { APIError } from '../lib/api/error';

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

  it('splits documents separated by the `...` end marker', () => {
    const multi = `${projectYaml}...\n${workspaceYaml}`;
    const result: MultiDocResult = parseYamlDocuments('multi.yaml', multi);
    assertValid(result);
    expect(result.resources.map((r) => r.kind)).toEqual(['Project', 'Workspace']);
  });

  it('does not split a `---` that appears inside a block scalar', () => {
    const content =
      'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: cm\ndata:\n  body: |\n    ---\n    not a separator\n';
    const result: MultiDocResult = parseYamlDocuments('cm.yaml', content);
    assertValid(result);
    expect(result.resources).toHaveLength(1);
  });

  it('expands a `kind: List` wrapper into individual resources', () => {
    const list = [
      'apiVersion: v1',
      'kind: List',
      'items:',
      '  - { apiVersion: v1, kind: ConfigMap, metadata: { name: a } }',
      '  - { apiVersion: v1, kind: Secret, metadata: { name: b } }',
      '',
    ].join('\n');
    const result: MultiDocResult = parseYamlDocuments('list.yaml', list);
    assertValid(result);
    expect(result.resources.map((r) => r.kind)).toEqual(['ConfigMap', 'Secret']);
    expect(result.resources).toHaveLength(result.texts.length);
  });

  it('expands a top-level sequence of resources', () => {
    const seq = [
      '- { apiVersion: v1, kind: ConfigMap, metadata: { name: a } }',
      '- { apiVersion: v1, kind: Secret, metadata: { name: b } }',
      '',
    ].join('\n');
    const result: MultiDocResult = parseYamlDocuments('seq.yaml', seq);
    assertValid(result);
    expect(result.resources.map((r) => r.metadata.name)).toEqual(['a', 'b']);
  });

  it('preserves comments and per-resource source text', () => {
    const content =
      '# head comment\napiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: cm # inline\n---\nkind: Second\napiVersion: v1\nmetadata:\n  name: s\n';
    const result: MultiDocResult = parseYamlDocuments('cm.yaml', content);
    assertValid(result);
    expect(result.texts).toHaveLength(2);
    expect(result.texts[0]).toContain('# head comment');
    expect(result.texts[0]).toContain('# inline');
    // The second document's source must not carry the leading `---` separator.
    expect(result.texts[1].startsWith('---')).toBe(false);
    expect(result.texts[1]).toContain('kind: Second');
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

  it('applies any other kind through the generic applyYaml mutation', async () => {
    const mutate = vi.fn().mockResolvedValue({ data: { applyYaml: '{}' } });
    const client = { mutate } as unknown as ApolloClient;
    const configMap: ParsedResource = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: { name: 'cm', namespace: 'ns' },
    };
    const result = await applyOnboardingResource(configMap, false, client);
    expect(result.success).toBe(true);
    const call = mutate.mock.calls[0][0];
    expect(typeof call.variables.yaml).toBe('string');
    expect(call.variables.yaml).toContain('kind: ConfigMap');
    // No per-kind refetch for the generic path.
    expect(call.refetchQueries).toBeUndefined();
  });

  it('refuses a dry run for a generic (applyYaml) kind', async () => {
    const mutate = vi.fn();
    const client = { mutate } as unknown as ApolloClient;
    const configMap: ParsedResource = { apiVersion: 'v1', kind: 'ConfigMap', metadata: { name: 'cm' } };
    await expect(applyOnboardingResource(configMap, false, client, true)).rejects.toThrow();
    expect(mutate).not.toHaveBeenCalled();
  });
});

describe('queue helpers', () => {
  const cm = (name: string, namespace?: string): ParsedResource => ({
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: { name, namespace },
  });

  it('resourceIdentity distinguishes by apiVersion/kind/namespace/name', () => {
    expect(resourceIdentity(cm('a'))).toBe('v1|ConfigMap||a');
    expect(resourceIdentity(cm('a', 'ns'))).toBe('v1|ConfigMap|ns|a');
    expect(resourceIdentity(cm('a'))).not.toBe(resourceIdentity(cm('b')));
  });

  it('dedupeResources keeps only resources not already present', () => {
    const existing = [cm('a'), cm('b')];
    const incoming = [cm('a'), cm('c')];
    expect(dedupeResources(existing, incoming).map((r) => r.metadata.name)).toEqual(['c']);
    expect(dedupeResources(existing, [cm('a'), cm('b')])).toEqual([]);
  });

  it('nextIndexAfterRemove keeps the selection pointing at the same item', () => {
    // removing before the current item shifts the selection down by one
    expect(nextIndexAfterRemove(0, 2, 4)).toBe(1);
    // removing after the current item leaves it unchanged
    expect(nextIndexAfterRemove(3, 1, 4)).toBe(1);
    // removing the current (non-last) item keeps the index (next item slides in)
    expect(nextIndexAfterRemove(1, 1, 4)).toBe(1);
    // removing the current last item clamps to the new last index
    expect(nextIndexAfterRemove(3, 3, 4)).toBe(2);
  });
});

describe('Control Plane resource discovery', () => {
  const apiConfig: ApiConfig = {
    mcpConfig: { projectName: 'project', workspaceName: 'workspace', controlPlaneName: 'cp' },
  };

  it.each([
    ['v1', 'Secret', 'secrets', '/api/v1'],
    ['v1', 'ConfigMap', 'configmaps', '/api/v1'],
    ['v1', 'Namespace', 'namespaces', '/api/v1'],
    ['apps/v1', 'Deployment', 'deployments', '/apis/apps/v1'],
    ['example.io/v1alpha1', 'Person', 'people', '/apis/example.io/v1alpha1'],
  ])('resolves %s %s through API discovery without a CRD lookup', async (apiVersion, kind, name, path) => {
    vi.mocked(fetchApiServerJson).mockResolvedValueOnce({ resources: [{ kind, name }] });
    const resource: ParsedResource = { apiVersion, kind, metadata: { name: 'test' } };

    await expect(resolveCpResourcePlural(resource, apiConfig)).resolves.toBe(name);
    expect(fetchApiServerJson).toHaveBeenLastCalledWith(path, apiConfig);
  });

  it('ignores subresources even when listed before their parent with the same kind', async () => {
    vi.mocked(fetchApiServerJson).mockResolvedValueOnce({
      resources: [
        { kind: 'Deployment', name: 'deployments/status' },
        { kind: 'Deployment', name: 'deployments' },
      ],
    });
    const resource: ParsedResource = { apiVersion: 'apps/v1', kind: 'Deployment', metadata: { name: 'test' } };

    await expect(resolveCpResourcePlural(resource, apiConfig)).resolves.toBe('deployments');
  });

  it('resolves identically named kinds separately for each group and version', async () => {
    const resource: ParsedResource = { apiVersion: 'first.io/v1', kind: 'Entry', metadata: { name: 'test' } };
    vi.mocked(fetchApiServerJson).mockResolvedValueOnce({ resources: [{ kind: 'Entry', name: 'entries' }] });
    await expect(resolveCpResourcePlural(resource, apiConfig)).resolves.toBe('entries');
    expect(fetchApiServerJson).toHaveBeenLastCalledWith('/apis/first.io/v1', apiConfig);

    vi.mocked(fetchApiServerJson).mockResolvedValueOnce({ resources: [{ kind: 'Entry', name: 'customentries' }] });
    await expect(resolveCpResourcePlural({ ...resource, apiVersion: 'second.io/v1beta1' }, apiConfig)).resolves.toBe(
      'customentries',
    );
    expect(fetchApiServerJson).toHaveBeenLastCalledWith('/apis/second.io/v1beta1', apiConfig);
  });

  it('returns no match when the kind is absent from discovery', async () => {
    vi.mocked(fetchApiServerJson).mockResolvedValueOnce({ resources: [{ kind: 'ConfigMap', name: 'configmaps' }] });
    const resource: ParsedResource = { apiVersion: 'v1', kind: 'Unknown', metadata: { name: 'test' } };

    await expect(resolveCpResourcePlural(resource, apiConfig)).resolves.toBe('');
  });

  it.each([403, 404, 500])('propagates a discovery HTTP %s instead of reporting an unknown kind', async (status) => {
    const error = new APIError('discovery failed', status);
    vi.mocked(fetchApiServerJson).mockRejectedValueOnce(error);
    const resource: ParsedResource = { apiVersion: 'v1', kind: 'Secret', metadata: { name: 'test' } };

    await expect(resolveCpResourcePlural(resource, apiConfig)).rejects.toBe(error);
  });

  it('checks, dry-runs and applies a discovered Secret at the core API endpoint', async () => {
    const resource: ParsedResource = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: { name: 'test', namespace: 'ns' },
      data: { token: 'dGVzdA==' },
    };
    vi.mocked(fetchApiServerJson).mockResolvedValueOnce({ resources: [{ kind: 'Secret', name: 'secrets' }] });
    const plural = await resolveCpResourcePlural(resource, apiConfig);

    await expect(checkCpResourceExists(resource, plural, apiConfig)).resolves.toBe(true);
    expect(fetchApiServerJson).toHaveBeenLastCalledWith('/api/v1/namespaces/ns/secrets/test', apiConfig);

    for (const dryRun of [true, false]) {
      await applyCpResource(resource, plural, apiConfig, dryRun);
      expect(fetchApiServerJson).toHaveBeenLastCalledWith(
        `/api/v1/namespaces/ns/secrets/test?fieldManager=openmcp-ui&force=true${dryRun ? '&dryRun=All' : ''}`,
        apiConfig,
        undefined,
        'PATCH',
        expect.stringContaining('token: dGVzdA=='),
        'application/apply-patch+yaml',
      );
    }
  });
});

describe('checkCpResourceExists', () => {
  const cpResource: ParsedResource = {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: { name: 'cm', namespace: 'ns' },
  };
  const cpApiConfig = {} as ApiConfig;

  it('returns true when the GET succeeds', async () => {
    vi.mocked(fetchApiServerJson).mockResolvedValueOnce({});
    await expect(checkCpResourceExists(cpResource, 'configmaps', cpApiConfig)).resolves.toBe(true);
  });

  it('returns false on a 404 (resource genuinely absent)', async () => {
    vi.mocked(fetchApiServerJson).mockRejectedValueOnce(new APIError('not found', 404));
    await expect(checkCpResourceExists(cpResource, 'configmaps', cpApiConfig)).resolves.toBe(false);
  });

  it('rethrows a 403 so the caller can surface indeterminate existence', async () => {
    vi.mocked(fetchApiServerJson).mockRejectedValueOnce(new APIError('forbidden', 403));
    await expect(checkCpResourceExists(cpResource, 'configmaps', cpApiConfig)).rejects.toThrow();
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
