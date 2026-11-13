import { describe, expect, it } from 'vitest';
import {
  decodeRoleRef,
  encodeRoleRef,
  formatRoleRef,
  isNamespacedRole,
  isPresetClusterRole,
  isValidClusterRoleName,
  mapMemberRoleToClusterRole,
  uniqueRoles,
} from './clusterRoles.ts';

describe('clusterRoles', () => {
  it('encodes ClusterRoles as their plain name', () => {
    expect(encodeRoleRef({ kind: 'ClusterRole', name: 'view' })).toBe('view');
    expect(encodeRoleRef({ name: ' my-role ' })).toBe('my-role');
  });

  it('encodes namespaced Roles with kind and namespace, and decodes them back', () => {
    const encoded = encodeRoleRef({ kind: 'Role', name: 'deployer', namespace: 'team-a' });
    expect(encoded).toBe('Role/team-a/deployer');
    expect(decodeRoleRef(encoded!)).toEqual({ kind: 'Role', name: 'deployer', namespace: 'team-a' });
    expect(isNamespacedRole(encoded!)).toBe(true);
    expect(formatRoleRef(encoded!)).toBe('team-a/deployer');
  });

  it('decodes any other value as a ClusterRole, including names with colons', () => {
    expect(decodeRoleRef('system:aggregate-to-view')).toEqual({
      kind: 'ClusterRole',
      name: 'system:aggregate-to-view',
    });
    expect(isNamespacedRole('cluster-admin')).toBe(false);
    expect(formatRoleRef('cluster-admin')).toBe('cluster-admin');
  });

  it('returns undefined for a role ref without a name', () => {
    expect(encodeRoleRef({ kind: 'ClusterRole', name: '' })).toBeUndefined();
    expect(encodeRoleRef({ kind: 'ClusterRole', name: null })).toBeUndefined();
  });

  it('knows the built-in user-facing ClusterRoles', () => {
    expect(['cluster-admin', 'admin', 'edit', 'view'].every(isPresetClusterRole)).toBe(true);
    expect(isPresetClusterRole('viewer')).toBe(false);
  });

  it('validates ClusterRole names as RBAC path segment names', () => {
    expect(isValidClusterRoleName('crossplane-view')).toBe(true);
    expect(isValidClusterRoleName('system:aggregate-to-view')).toBe(true);
    expect(isValidClusterRoleName('')).toBe(false);
    expect(isValidClusterRoleName('..')).toBe(false);
    expect(isValidClusterRoleName('a/b')).toBe(false);
    expect(isValidClusterRoleName('a b')).toBe(false);
    expect(isValidClusterRoleName('x'.repeat(254))).toBe(false);
  });

  it('maps project/workspace roles to ClusterRoles without promoting unknown roles to cluster-admin', () => {
    expect(mapMemberRoleToClusterRole('admin')).toBe('cluster-admin');
    expect(mapMemberRoleToClusterRole(undefined)).toBe('cluster-admin');
    expect(mapMemberRoleToClusterRole('view')).toBe('view');
    expect(mapMemberRoleToClusterRole('Viewer')).toBe('view');
    expect(mapMemberRoleToClusterRole('edit')).toBe('edit');
    expect(mapMemberRoleToClusterRole('my-custom-role')).toBe('my-custom-role');
  });

  it('de-duplicates roles keeping first-seen order', () => {
    expect(uniqueRoles(['view', undefined, 'edit', 'view', null, ''])).toEqual(['view', 'edit']);
  });
});
