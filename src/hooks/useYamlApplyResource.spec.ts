import { describe, expect, it } from 'vitest';

import { parseYamlDocuments, validateYamlFile } from './useYamlApplyResource';
import type { MultiDocResult, ValidationResult } from './useYamlApplyResource';

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
