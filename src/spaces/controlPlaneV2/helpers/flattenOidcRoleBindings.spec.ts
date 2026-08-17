import { describe, expect, it } from 'vitest';
import { isUnnamedProvider } from '../../../lib/api/types/shared/members.ts';
import { flattenOidcRoleBindings } from './flattenOidcRoleBindings.ts';

describe('flattenOidcRoleBindings', () => {
  it('returns an empty array when oidc is undefined', () => {
    expect(flattenOidcRoleBindings(undefined)).toEqual([]);
  });

  it('flattens the default provider without a provider tag', () => {
    const result = flattenOidcRoleBindings({
      defaultProvider: {
        roleBindings: [
          {
            roleRefs: [{ name: 'cluster-admin' }],
            subjects: [{ kind: 'User', name: 'alice@example.com' }],
          },
        ],
      },
    });
    expect(result).toEqual([
      { role: 'cluster-admin', subjects: [{ kind: 'User', name: 'alice@example.com' }], provider: undefined },
    ]);
  });

  it('tags bindings from extraProviders with the provider name', () => {
    const result = flattenOidcRoleBindings({
      extraProviders: [
        {
          name: 'okta',
          roleBindings: [
            {
              roleRefs: [{ name: 'viewer' }],
              subjects: [{ kind: 'User', name: 'bob@example.com' }],
            },
          ],
        },
      ],
    });
    expect(result).toEqual([
      { role: 'viewer', subjects: [{ kind: 'User', name: 'bob@example.com' }], provider: 'okta' },
    ]);
  });

  it('combines default and extra providers, keeping the same subject distinct per provider', () => {
    const result = flattenOidcRoleBindings({
      defaultProvider: {
        roleBindings: [
          { roleRefs: [{ name: 'cluster-admin' }], subjects: [{ kind: 'User', name: 'alice@example.com' }] },
        ],
      },
      extraProviders: [
        {
          name: 'okta',
          roleBindings: [{ roleRefs: [{ name: 'viewer' }], subjects: [{ kind: 'User', name: 'alice@example.com' }] }],
        },
      ],
    });
    expect(result).toEqual([
      { role: 'cluster-admin', subjects: [{ kind: 'User', name: 'alice@example.com' }], provider: undefined },
      { role: 'viewer', subjects: [{ kind: 'User', name: 'alice@example.com' }], provider: 'okta' },
    ]);
  });

  it('gives extraProviders entries without a name a distinct synthetic provider tag, never undefined', () => {
    // Simulates a query that doesn't fetch extraProviders[].name.
    const result = flattenOidcRoleBindings({
      defaultProvider: {
        roleBindings: [
          { roleRefs: [{ name: 'cluster-admin' }], subjects: [{ kind: 'User', name: 'alice@example.com' }] },
        ],
      },
      extraProviders: [
        { roleBindings: [{ roleRefs: [{ name: 'viewer' }], subjects: [{ kind: 'User', name: 'alice@example.com' }] }] },
      ],
    });
    expect(result[0].provider).toBeUndefined();
    expect(result[1].provider).toBeDefined();
    expect(result[1].provider).not.toBe(result[0].provider);
    expect(isUnnamedProvider(result[1].provider)).toBe(true);
  });

  it('gives each unnamed extraProviders entry its own distinct tag', () => {
    const result = flattenOidcRoleBindings({
      extraProviders: [
        { roleBindings: [{ roleRefs: [{ name: 'viewer' }], subjects: [{ kind: 'User', name: 'a@example.com' }] }] },
        { roleBindings: [{ roleRefs: [{ name: 'viewer' }], subjects: [{ kind: 'User', name: 'b@example.com' }] }] },
      ],
    });
    expect(result[0].provider).not.toBe(result[1].provider);
  });

  it('drops incomplete subjects and bindings without roleRefs', () => {
    const result = flattenOidcRoleBindings({
      defaultProvider: {
        roleBindings: [
          { roleRefs: [{ name: 'viewer' }], subjects: [{ kind: null, name: 'incomplete@example.com' }] },
          null,
        ],
      },
    });
    expect(result).toEqual([{ role: 'viewer', subjects: [], provider: undefined }]);
  });

  it('returns an empty array when roleBindings contains only null entries', () => {
    const result = flattenOidcRoleBindings({
      defaultProvider: { roleBindings: [null, null] },
    });
    expect(result).toEqual([]);
  });
});
