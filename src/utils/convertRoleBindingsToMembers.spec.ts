import { describe, expect, it } from 'vitest';
import { convertRoleBindingsToMembers } from './convertRoleBindingsToMembers.ts';

describe('convertRoleBindingsToMembers', () => {
  it('returns an empty array when roleBindings is undefined', () => {
    expect(convertRoleBindingsToMembers(undefined)).toEqual([]);
  });

  it('merges multiple roles for the same subject within one provider', () => {
    const result = convertRoleBindingsToMembers([
      { role: 'cluster-admin', subjects: [{ kind: 'User', name: 'alice@example.com' }] },
      { role: 'viewer', subjects: [{ kind: 'User', name: 'alice@example.com' }] },
    ]);
    expect(result).toEqual([
      { kind: 'User', name: 'alice@example.com', roles: ['cluster-admin', 'viewer'], provider: undefined },
    ]);
  });

  it('keeps the same subject as distinct members when granted by different providers', () => {
    const result = convertRoleBindingsToMembers([
      { role: 'cluster-admin', subjects: [{ kind: 'User', name: 'alice@example.com' }], provider: undefined },
      { role: 'viewer', subjects: [{ kind: 'User', name: 'alice@example.com' }], provider: 'okta' },
    ]);
    expect(result).toEqual([
      { kind: 'User', name: 'alice@example.com', roles: ['cluster-admin'], provider: undefined },
      { kind: 'User', name: 'alice@example.com', roles: ['viewer'], provider: 'okta' },
    ]);
  });
});
