import { describe, it, expect } from 'vitest';
import { extractMcpV2FormState } from './extractMcpV2FormState.ts';
import { ManagedControlPlaneV2 } from '../../onboarding/types/ControlPlane.ts';

function makeControlPlane(spec: ManagedControlPlaneV2['spec']): ManagedControlPlaneV2 {
  return {
    metadata: { name: 'my-mcp', namespace: 'project-x--ws-y', creationTimestamp: '', annotations: {} },
    spec,
  };
}

describe('extractMcpV2FormState', () => {
  it('extracts default-provider members and marks it enabled when roleBindings are present', () => {
    const state = extractMcpV2FormState(
      makeControlPlane({
        iam: {
          oidc: {
            defaultProvider: {
              roleBindings: [
                {
                  roleRefs: [{ kind: 'ClusterRole', name: 'cluster-admin' }],
                  subjects: [{ kind: 'User', name: 'openmcp:alice' }],
                },
              ],
            },
            extraProviders: [],
          },
        },
      }),
    );
    expect(state.isDefaultProviderEnabled).toBe(true);
    expect(state.members).toEqual([{ kind: 'User', name: 'alice', roles: ['cluster-admin'] }]);
    expect(state.extraProviders).toEqual([]);
  });

  it('marks the default provider disabled when roleBindings are absent', () => {
    const state = extractMcpV2FormState(
      makeControlPlane({ iam: { oidc: { defaultProvider: null, extraProviders: [] } } }),
    );
    expect(state.isDefaultProviderEnabled).toBe(false);
    expect(state.members).toEqual([]);
  });

  it('marks the default provider disabled when roleBindings is an empty array', () => {
    const state = extractMcpV2FormState(
      makeControlPlane({ iam: { oidc: { defaultProvider: { roleBindings: [] }, extraProviders: [] } } }),
    );
    expect(state.isDefaultProviderEnabled).toBe(false);
  });

  it('extracts an extra provider, reading subject names verbatim (the CRD adds the prefix automatically, not stored in spec)', () => {
    const state = extractMcpV2FormState(
      makeControlPlane({
        iam: {
          oidc: {
            defaultProvider: null,
            extraProviders: [
              {
                name: 'custom',
                issuer: 'https://openmcp.accounts.ondemand.com',
                clientID: 'client-id-1',
                usernameClaim: 'email',
                roleBindings: [
                  {
                    roleRefs: [{ kind: 'ClusterRole', name: 'cluster-admin' }],
                    subjects: [{ kind: 'User', name: 'bob' }],
                  },
                ],
              },
            ],
          },
        },
      }),
    );
    expect(state.extraProviders).toEqual([
      {
        name: 'custom',
        issuer: 'https://openmcp.accounts.ondemand.com',
        clientID: 'client-id-1',
        usernameClaim: 'email',
        usernamePrefix: undefined,
        groupsClaim: undefined,
        groupsPrefix: undefined,
        extraScopes: [],
      },
    ]);
    expect(state.members).toEqual([{ kind: 'User', name: 'bob', roles: ['cluster-admin'], provider: 'custom' }]);
  });

  it('reads subject names verbatim regardless of the provider usernamePrefix/groupsPrefix setting', () => {
    const state = extractMcpV2FormState(
      makeControlPlane({
        iam: {
          oidc: {
            defaultProvider: null,
            extraProviders: [
              {
                name: 'custom',
                issuer: 'https://example.com',
                clientID: 'client-id-1',
                usernamePrefix: 'other-',
                groupsPrefix: 'group-',
                roleBindings: [
                  {
                    roleRefs: [{ kind: 'ClusterRole', name: 'cluster-admin' }],
                    subjects: [
                      { kind: 'User', name: 'bob' },
                      { kind: 'Group', name: 'admins' },
                    ],
                  },
                ],
              },
            ],
          },
        },
      }),
    );
    expect(state.members).toEqual([
      { kind: 'User', name: 'bob', roles: ['cluster-admin'], provider: 'custom' },
      { kind: 'Group', name: 'admins', roles: ['cluster-admin'], provider: 'custom' },
    ]);
    expect(state.extraProviders[0].usernamePrefix).toBe('other-');
  });

  it('combines default-provider and extra-provider members into a single list', () => {
    const state = extractMcpV2FormState(
      makeControlPlane({
        iam: {
          oidc: {
            defaultProvider: {
              roleBindings: [
                {
                  roleRefs: [{ kind: 'ClusterRole', name: 'cluster-admin' }],
                  subjects: [{ kind: 'User', name: 'openmcp:alice' }],
                },
              ],
            },
            extraProviders: [
              {
                name: 'custom',
                issuer: 'https://example.com',
                clientID: 'client-id-1',
                roleBindings: [
                  {
                    roleRefs: [{ kind: 'ClusterRole', name: 'cluster-admin' }],
                    subjects: [{ kind: 'User', name: 'bob' }],
                  },
                ],
              },
            ],
          },
        },
      }),
    );
    expect(state.members).toEqual([
      { kind: 'User', name: 'alice', roles: ['cluster-admin'] },
      { kind: 'User', name: 'bob', roles: ['cluster-admin'], provider: 'custom' },
    ]);
  });

  it('handles a control plane with no iam/oidc spec at all', () => {
    const state = extractMcpV2FormState(makeControlPlane(undefined));
    expect(state).toEqual({ members: [], extraProviders: [], isDefaultProviderEnabled: false });
  });
});
