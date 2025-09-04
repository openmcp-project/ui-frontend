import { describe, it, expect } from 'vitest';
import { areMembersEqual, Member } from './members.ts';

const makeMember = (overrides: Partial<Member> = {}): Member => ({
  kind: 'User',
  name: 'alice',
  namespace: 'default-namespace',
  roles: ['Viewer', 'Admin'],
  ...overrides,
});

describe('members', () => {
  describe('areMembersEqual', () => {
    it('returns true when a and b are the same reference', () => {
      const a = makeMember();
      expect(areMembersEqual(a, a)).toBe(true);
    });

    it('returns true when the members have the very same attributes', () => {
      const a = makeMember();
      const b = makeMember();
      expect(areMembersEqual(a, b)).toBe(true);
    });

    it('returns true even if the roles are sorted differently', () => {
      const a = makeMember({ roles: ['Viewer', 'Admin'] });
      const b = makeMember({ roles: ['Admin', 'Viewer'] });
      expect(areMembersEqual(a, b)).toBe(true);
    });

    it('handles empty roles correctly', () => {
      const a = makeMember({ roles: [] });
      const b = makeMember({ roles: [] });
      expect(areMembersEqual(a, b)).toBe(true);
    });

    it('returns false when b is undefined', () => {
      const a = makeMember();
      expect(areMembersEqual(a, undefined)).toBe(false);
    });

    it('returns false when kinds differ', () => {
      const a = makeMember({ kind: 'User' });
      const b = makeMember({ kind: 'ServiceAccount' });
      expect(areMembersEqual(a, b)).toBe(false);
    });

    it('returns false when names differ', () => {
      const a = makeMember({ name: 'alice' });
      const b = makeMember({ name: 'bob' });
      expect(areMembersEqual(a, b)).toBe(false);
    });

    it('returns false when namespaces differ', () => {
      const a = makeMember({ namespace: 'namespace-a' });
      const b = makeMember({ namespace: 'namespace-b' });
      expect(areMembersEqual(a, b)).toBe(false);
    });

    it('returns false when role counts differ', () => {
      const a = makeMember({ roles: ['Viewer', 'Admin'] });
      const b = makeMember({ roles: ['Viewer'] });
      expect(areMembersEqual(a, b)).toBe(false);
    });

    it('returns false when roles differ (same length)', () => {
      const a = makeMember({ roles: ['Viewer', 'Admin'] });
      const b = makeMember({ roles: ['Viewer', 'OtherRole'] });
      expect(areMembersEqual(a, b)).toBe(false);
    });

    it('does not treat duplicate roles in a special way (debatable)', () => {
      const a = makeMember({ roles: ['Viewer', 'Admin'] });
      const b = makeMember({ roles: ['Viewer', 'Viewer', 'Admin'] });
      expect(areMembersEqual(a, b)).toBe(false);
    });

    it('fails when b has a role a does not have', () => {
      const a = makeMember({ roles: ['Viewer'] });
      const b = makeMember({ roles: ['Viewer', 'Admin'] });
      expect(areMembersEqual(a, b)).toBe(false);
    });
  });
});
