import { describe, expect, it, vi } from 'vitest';
import { validateYamlFile, parseYamlDocuments, buildCpPath } from './useYamlApplyResource';

// ---------------------------------------------------------------------------
// validateYamlFile
// ---------------------------------------------------------------------------

describe('validateYamlFile', () => {
  const validYaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 1`;

  it('accepts a valid .yaml file', () => {
    expect(validateYamlFile('file.yaml', validYaml)).toMatchObject({
      valid: true,
      resource: { kind: 'Deployment', metadata: { name: 'my-app' } },
    });
  });

  it('accepts a valid .yml extension', () => {
    expect(validateYamlFile('file.yml', validYaml)).toMatchObject({ valid: true });
  });

  it('rejects a non-YAML extension', () => {
    expect(validateYamlFile('file.json', validYaml)).toMatchObject({ valid: false, error: 'wrong-file-type' });
  });

  it('rejects malformed YAML', () => {
    expect(validateYamlFile('file.yaml', 'key: [unclosed bracket')).toMatchObject({
      valid: false,
      error: 'parse-error',
    });
  });

  it('rejects YAML missing apiVersion', () => {
    const result = validateYamlFile('file.yaml', 'kind: Deployment\nmetadata:\n  name: x');
    expect(result).toMatchObject({ valid: false, error: 'missing-fields' });
    expect((result as { message: string }).message).toContain('apiVersion');
  });

  it('rejects YAML missing kind', () => {
    const result = validateYamlFile('file.yaml', 'apiVersion: v1\nmetadata:\n  name: x');
    expect(result).toMatchObject({ valid: false, error: 'missing-fields' });
    expect((result as { message: string }).message).toContain('kind');
  });

  it('rejects YAML missing metadata.name', () => {
    const result = validateYamlFile('file.yaml', 'apiVersion: v1\nkind: Pod\nmetadata:\n  namespace: default');
    expect(result).toMatchObject({ valid: false, error: 'missing-fields' });
    expect((result as { message: string }).message).toContain('metadata.name');
  });
});

// ---------------------------------------------------------------------------
// parseYamlDocuments
// ---------------------------------------------------------------------------

describe('parseYamlDocuments', () => {
  const doc1 = `apiVersion: v1
kind: ConfigMap
metadata:
  name: cm1`;

  const doc2 = `apiVersion: v1
kind: ConfigMap
metadata:
  name: cm2`;

  it('parses a single document', () => {
    const result = parseYamlDocuments('file.yaml', doc1);
    expect(result).toMatchObject({ valid: true });
    expect((result as { resources: unknown[] }).resources).toHaveLength(1);
    expect((result as { resources: { metadata: { name: string } }[] }).resources[0].metadata.name).toBe('cm1');
  });

  it('parses multiple documents', () => {
    const result = parseYamlDocuments('file.yaml', `${doc1}\n---\n${doc2}`);
    expect(result).toMatchObject({ valid: true });
    expect((result as { resources: unknown[] }).resources).toHaveLength(2);
  });

  it('skips blank --- separators', () => {
    const result = parseYamlDocuments('file.yaml', `${doc1}\n---\n---\n${doc2}`);
    expect(result).toMatchObject({ valid: true });
    expect((result as { resources: unknown[] }).resources).toHaveLength(2);
  });

  it('fails on the first invalid document', () => {
    const invalid = `apiVersion: v1\nkind: ConfigMap`;
    expect(parseYamlDocuments('file.yaml', `${doc1}\n---\n${invalid}`)).toMatchObject({
      valid: false,
      error: 'missing-fields',
    });
  });

  it('returns empty-file for a file with only blank separators', () => {
    expect(parseYamlDocuments('file.yaml', '---\n---\n')).toMatchObject({ valid: false, error: 'empty-file' });
  });

  it('rejects wrong file extension', () => {
    expect(parseYamlDocuments('file.txt', doc1)).toMatchObject({ valid: false, error: 'wrong-file-type' });
  });
});

// ---------------------------------------------------------------------------
// buildCpPath
// ---------------------------------------------------------------------------

describe('buildCpPath', () => {
  it('builds a core resource path', () => {
    expect(buildCpPath('v1', 'pods', 'default', 'my-pod')).toBe('/api/v1/namespaces/default/pods/my-pod');
  });

  it('builds a group-versioned resource path', () => {
    expect(buildCpPath('apps/v1', 'deployments', 'default', 'my-app')).toBe(
      '/apis/apps/v1/namespaces/default/deployments/my-app',
    );
  });

  it('builds a cluster-scoped path without namespace', () => {
    expect(buildCpPath('apiextensions.k8s.io/v1', 'customresourcedefinitions', undefined, 'foos.example.com')).toBe(
      '/apis/apiextensions.k8s.io/v1/customresourcedefinitions/foos.example.com',
    );
  });

  it('builds a list path without name', () => {
    expect(buildCpPath('v1', 'pods', 'default')).toBe('/api/v1/namespaces/default/pods');
  });
});

// ---------------------------------------------------------------------------
// dryRunCpResource / applyCpResource
// ---------------------------------------------------------------------------

describe('dryRunCpResource', () => {
  it('sends PATCH with dryRun=All', async () => {
    const { dryRunCpResource } = await import('./useYamlApplyResource');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '{}',
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.mock('../spaces/onboarding/auth/tokenRefresh', () => ({ refreshToken: () => Promise.resolve(true) }));
    vi.mock('../spaces/mcp/auth/tokenRefresh', () => ({ refreshToken: () => Promise.resolve(true) }));

    const resource = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: { name: 'my-app', namespace: 'default' },
    };
    const apiConfig = { mcpConfig: { projectName: 'p', workspaceName: 'w', controlPlaneName: 'cp' } };

    await dryRunCpResource(resource, 'apiVersion: apps/v1\nkind: Deployment\n', 'deployments', apiConfig);

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('dryRun=All');
    expect(url).toContain('fieldManager=openmcp-ui');
    vi.unstubAllGlobals();
  });

  it('sends PATCH without dryRun for real apply', async () => {
    const { applyCpResource } = await import('./useYamlApplyResource');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '{}',
    });
    vi.stubGlobal('fetch', fetchMock);

    const resource = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: { name: 'my-app', namespace: 'default' },
    };
    const apiConfig = { mcpConfig: { projectName: 'p', workspaceName: 'w', controlPlaneName: 'cp' } };

    await applyCpResource(resource, 'apiVersion: apps/v1\nkind: Deployment\n', 'deployments', apiConfig);

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).not.toContain('dryRun=All');
    expect(url).toContain('fieldManager=openmcp-ui');
    vi.unstubAllGlobals();
  });
});

// ---------------------------------------------------------------------------
// applyOnboardingResource — mutation routing
// ---------------------------------------------------------------------------

describe('applyOnboardingResource', () => {
  const makeClient = (mutateImpl: ReturnType<typeof vi.fn>) =>
    ({
      mutate: mutateImpl,
      query: vi.fn().mockResolvedValue({ data: {} }),
    }) as unknown as import('./useYamlApplyResource').OnboardingClient;

  const projectResource = {
    apiVersion: 'core.openmcp.cloud/v1alpha1',
    kind: 'Project',
    metadata: { name: 'my-project', annotations: {}, labels: {} },
    spec: { members: [] },
  };

  const workspaceResource = {
    apiVersion: 'core.openmcp.cloud/v1alpha1',
    kind: 'Workspace',
    metadata: { name: 'my-ws', namespace: 'project-my-project', annotations: {}, labels: {} },
    spec: { members: [] },
  };

  it('calls createProject mutation for a new Project', async () => {
    const { applyOnboardingResource } = await import('./useYamlApplyResource');
    const mutateMock = vi.fn().mockResolvedValue({ data: {} });
    const client = makeClient(mutateMock);

    await applyOnboardingResource(projectResource, false, client);
    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(mutateMock.mock.calls[0][0].mutation.definitions[0].name.value).toMatch(/ApplyCreateProject/i);
  });

  it('calls createWorkspace mutation for a new Workspace', async () => {
    const { applyOnboardingResource } = await import('./useYamlApplyResource');
    const mutateMock = vi.fn().mockResolvedValue({ data: {} });
    const client = makeClient(mutateMock);

    await applyOnboardingResource(workspaceResource, false, client);
    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(mutateMock.mock.calls[0][0].mutation.definitions[0].name.value).toMatch(/ApplyCreateWorkspace/i);
  });

  it('calls updateWorkspace mutation when Workspace exists', async () => {
    const { applyOnboardingResource } = await import('./useYamlApplyResource');
    const mutateMock = vi.fn().mockResolvedValue({ data: {} });
    const client = makeClient(mutateMock);

    await applyOnboardingResource(workspaceResource, true, client);
    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(mutateMock.mock.calls[0][0].mutation.definitions[0].name.value).toMatch(/ApplyUpdateWorkspace/i);
  });

  it('passes dryRun=true without refetchQueries when dryRun flag set', async () => {
    const { applyOnboardingResource } = await import('./useYamlApplyResource');
    const mutateMock = vi.fn().mockResolvedValue({ data: {} });
    const client = makeClient(mutateMock);

    await applyOnboardingResource(projectResource, false, client, true);
    expect(mutateMock.mock.calls[0][0].variables.dryRun).toBe(true);
  });

  it('throws for unsupported kind', async () => {
    const { applyOnboardingResource } = await import('./useYamlApplyResource');
    const mutateMock = vi.fn().mockResolvedValue({ data: {} });
    const client = makeClient(mutateMock);

    const unknownResource = {
      apiVersion: 'v1',
      kind: 'UnknownKind',
      metadata: { name: 'x', annotations: {}, labels: {} },
    };

    await expect(applyOnboardingResource(unknownResource, false, client)).rejects.toThrow('Unsupported kind');
  });
});
