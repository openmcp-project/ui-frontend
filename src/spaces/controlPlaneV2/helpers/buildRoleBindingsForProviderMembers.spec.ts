import { describe, expect, it } from 'vitest';
import { Member } from '../../../lib/api/types/shared/members.ts';
import { ManagedControlPlaneV2 } from '../../onboarding/types/ControlPlane.ts';
import { buildRoleBindingsForProviderMembers } from './buildRoleBindingsForProviderMembers.ts';
import { extractMcpV2FormState } from './extractMcpV2FormState.ts';

describe('buildRoleBindingsForProviderMembers', () => {
  it('writes the ClusterRole a member was given instead of forcing cluster-admin', () => {
    const members: Member[] = [
      { kind: 'User', name: 'alice@example.com', roles: ['cluster-admin'] },
      { kind: 'User', name: 'bob@example.com', roles: ['view'] },
      { kind: 'Group', name: 'platform-team', roles: ['my-custom-role'] },
    ];
    expect(buildRoleBindingsForProviderMembers(members)).toEqual([
      {
        roleRefs: [{ kind: 'ClusterRole', name: 'cluster-admin' }],
        subjects: [{ kind: 'User', name: 'alice@example.com' }],
      },
      { roleRefs: [{ kind: 'ClusterRole', name: 'view' }], subjects: [{ kind: 'User', name: 'bob@example.com' }] },
      {
        roleRefs: [{ kind: 'ClusterRole', name: 'my-custom-role' }],
        subjects: [{ kind: 'Group', name: 'platform-team' }],
      },
    ]);
  });

  it('groups members with the same set of roles into one binding, regardless of role order', () => {
    const members: Member[] = [
      { kind: 'User', name: 'alice@example.com', roles: ['view', 'crossplane-view'] },
      { kind: 'User', name: 'bob@example.com', roles: ['crossplane-view', 'view'] },
      { kind: 'User', name: 'carol@example.com', roles: ['view'] },
    ];
    expect(buildRoleBindingsForProviderMembers(members)).toEqual([
      {
        roleRefs: [
          { kind: 'ClusterRole', name: 'view' },
          { kind: 'ClusterRole', name: 'crossplane-view' },
        ],
        subjects: [
          { kind: 'User', name: 'alice@example.com' },
          { kind: 'User', name: 'bob@example.com' },
        ],
      },
      { roleRefs: [{ kind: 'ClusterRole', name: 'view' }], subjects: [{ kind: 'User', name: 'carol@example.com' }] },
    ]);
  });

  it('writes namespaced Role refs with their namespace', () => {
    const members: Member[] = [{ kind: 'User', name: 'alice@example.com', roles: ['Role/team-a/deployer'] }];
    expect(buildRoleBindingsForProviderMembers(members)).toEqual([
      {
        roleRefs: [{ kind: 'Role', name: 'deployer', namespace: 'team-a' }],
        subjects: [{ kind: 'User', name: 'alice@example.com' }],
      },
    ]);
  });

  it('falls back to cluster-admin for a member without roles and skips members without a name', () => {
    const members: Member[] = [
      { kind: 'User', name: 'alice@example.com', roles: [] },
      { kind: 'User', name: '', roles: ['view'] },
    ];
    expect(buildRoleBindingsForProviderMembers(members)).toEqual([
      {
        roleRefs: [{ kind: 'ClusterRole', name: 'cluster-admin' }],
        subjects: [{ kind: 'User', name: 'alice@example.com' }],
      },
    ]);
  });

  it('round-trips existing bindings unchanged through extract → build', () => {
    const roleBindings = [
      {
        roleRefs: [{ kind: 'ClusterRole', name: 'cluster-admin' }],
        subjects: [{ kind: 'User', name: 'alice@example.com' }],
      },
      {
        roleRefs: [
          { kind: 'ClusterRole', name: 'view' },
          { kind: 'Role', name: 'deployer', namespace: 'team-a' },
        ],
        subjects: [
          { kind: 'User', name: 'bob@example.com' },
          { kind: 'Group', name: 'platform-team' },
        ],
      },
    ];
    const controlPlane: ManagedControlPlaneV2 = {
      metadata: { name: 'my-mcp', namespace: 'project-x--ws-y', creationTimestamp: '', annotations: {} },
      spec: { iam: { oidc: { defaultProvider: { roleBindings }, extraProviders: [] } } },
    };
    const { members } = extractMcpV2FormState(controlPlane);
    expect(buildRoleBindingsForProviderMembers(members)).toEqual(roleBindings);
  });
});
