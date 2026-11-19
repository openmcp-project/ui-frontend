import { describe, expect, it } from 'vitest';
import {
  clusterRoleTemplate,
  isReadOnlyClusterRole,
  stripServerFields,
  validateClusterRoleYaml,
} from './clusterRoleDialog.ts';

const messages = {
  wrongType: 'wrong-type',
  multiDoc: 'multi-doc',
  invalidName: 'invalid-name',
  renamed: (expected: string) => `renamed:${expected}`,
  parseError: (detail: string) => `parse:${detail}`,
};

const validRole = `apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: my-role
rules: []
`;

describe('validateClusterRoleYaml', () => {
  it('accepts a single valid ClusterRole', () => {
    const result = validateClusterRoleYaml(validRole, messages);
    expect(result.valid).toBe(true);
  });

  it('rejects a non-ClusterRole kind', () => {
    const yaml = validRole.replace('kind: ClusterRole', 'kind: Role');
    const result = validateClusterRoleYaml(yaml, messages);
    expect(result).toEqual({ valid: false, message: 'wrong-type' });
  });

  it('rejects a wrong apiVersion', () => {
    const yaml = validRole.replace('rbac.authorization.k8s.io/v1', 'rbac.authorization.k8s.io/v1beta1');
    expect(validateClusterRoleYaml(yaml, messages)).toEqual({ valid: false, message: 'wrong-type' });
  });

  it('rejects multiple documents', () => {
    const yaml = `${validRole}---\n${validRole}`;
    expect(validateClusterRoleYaml(yaml, messages)).toEqual({ valid: false, message: 'multi-doc' });
  });

  it('rejects an invalid name', () => {
    const yaml = validRole.replace('name: my-role', 'name: "bad/name"');
    expect(validateClusterRoleYaml(yaml, messages)).toEqual({ valid: false, message: 'invalid-name' });
  });

  it('rejects a renamed role in Edit mode', () => {
    expect(validateClusterRoleYaml(validRole, messages, 'other-name')).toEqual({
      valid: false,
      message: 'renamed:other-name',
    });
  });

  it('accepts the same name in Edit mode', () => {
    expect(validateClusterRoleYaml(validRole, messages, 'my-role').valid).toBe(true);
  });
});

describe('stripServerFields', () => {
  it('drops server-managed metadata and keeps the rest', () => {
    const resource = {
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: 'ClusterRole',
      metadata: {
        name: 'my-role',
        resourceVersion: '123',
        uid: 'abc',
        creationTimestamp: '2020-01-01',
        generation: 2,
        managedFields: [{ manager: 'x' }],
        labels: { a: 'b' },
      },
      rules: [],
    };
    const stripped = stripServerFields(resource as never);
    expect(stripped.metadata).toEqual({ name: 'my-role', labels: { a: 'b' } });
    expect(stripped.rules).toEqual([]);
  });
});

describe('isReadOnlyClusterRole', () => {
  it('classifies the four built-in roles as read-only', () => {
    expect(['cluster-admin', 'admin', 'edit', 'view'].every((r) => isReadOnlyClusterRole(r, false))).toBe(true);
  });

  it('classifies system: and aggregated roles as read-only', () => {
    expect(isReadOnlyClusterRole('system:controller', false)).toBe(true);
    expect(isReadOnlyClusterRole('my-role', true)).toBe(true);
  });

  it('allows editing a plain custom role', () => {
    expect(isReadOnlyClusterRole('my-role', false)).toBe(false);
  });
});

describe('clusterRoleTemplate', () => {
  it('produces a valid, named ClusterRole', () => {
    const yaml = clusterRoleTemplate('my-new-role');
    expect(yaml).toContain('name: my-new-role');
    expect(validateClusterRoleYaml(yaml, messages).valid).toBe(true);
  });
});
