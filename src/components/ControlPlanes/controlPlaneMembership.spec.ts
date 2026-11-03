import { describe, expect, it } from 'vitest';
import { Member } from '../../lib/api/types/shared/members.ts';
import { adminMemberEmails, isEmailAdmin, isEmailMember } from './controlPlaneMembership.ts';

const user = (name: string, roles: string[] = ['view']): Member => ({ kind: 'User', name, roles });

describe('isEmailMember', () => {
  it('matches a User member case-insensitively', () => {
    const members = [user('Alice@Example.com')];
    expect(isEmailMember(members, 'alice@example.com')).toBe(true);
    expect(isEmailMember(members, 'ALICE@EXAMPLE.COM')).toBe(true);
  });

  it('returns false when the email is not a member', () => {
    expect(isEmailMember([user('alice@example.com')], 'bob@example.com')).toBe(false);
  });

  it('ignores non-User kinds', () => {
    const members: Member[] = [{ kind: 'Group', name: 'admins@example.com', roles: ['admin'] }];
    expect(isEmailMember(members, 'admins@example.com')).toBe(false);
  });

  it('returns false for a missing or empty email', () => {
    const members = [user('alice@example.com')];
    expect(isEmailMember(members, undefined)).toBe(false);
    expect(isEmailMember(members, '')).toBe(false);
  });

  it('matches when the member name carries an IdP prefix', () => {
    const members = [user('idpid:someone@sap.com')];
    expect(isEmailMember(members, 'someone@sap.com')).toBe(true);
    expect(isEmailMember(members, 'SOMEONE@SAP.COM')).toBe(true);
  });

  it('matches when the email itself carries an IdP prefix', () => {
    const members = [user('someone@sap.com')];
    expect(isEmailMember(members, 'idpid:someone@sap.com')).toBe(true);
  });

  it('returns false when there are no members', () => {
    expect(isEmailMember([], 'alice@example.com')).toBe(false);
  });
});

describe('adminMemberEmails', () => {
  it('picks V1 admin-role members', () => {
    const members = [user('viewer@example.com', ['view']), user('admin@example.com', ['admin'])];
    expect(adminMemberEmails(members)).toEqual(['admin@example.com']);
  });

  it('picks V2 cluster-admin-role members', () => {
    const members = [user('viewer@example.com', ['viewer']), user('admin@example.com', ['cluster-admin'])];
    expect(adminMemberEmails(members)).toEqual(['admin@example.com']);
  });

  it('ignores non-User kinds when collecting admins', () => {
    const members: Member[] = [{ kind: 'Group', name: 'admins@example.com', roles: ['admin'] }];
    expect(adminMemberEmails(members, 'creator@example.com')).toEqual(['creator@example.com']);
  });

  it('dedupes repeated admin emails', () => {
    const members = [user('admin@example.com', ['admin']), user('admin@example.com', ['cluster-admin'])];
    expect(adminMemberEmails(members)).toEqual(['admin@example.com']);
  });

  it('falls back to createdBy when there is no admin member', () => {
    const members = [user('viewer@example.com', ['view'])];
    expect(adminMemberEmails(members, 'creator@example.com')).toEqual(['creator@example.com']);
  });

  it('strips an IdP prefix from admin emails so the mailto recipient is valid', () => {
    const members = [user('idpid:admin@sap.com', ['admin'])];
    expect(adminMemberEmails(members)).toEqual(['admin@sap.com']);
  });

  it('returns an empty array when there is no admin and no createdBy', () => {
    expect(adminMemberEmails([user('viewer@example.com', ['view'])])).toEqual([]);
    expect(adminMemberEmails([])).toEqual([]);
  });
});

describe('isEmailAdmin', () => {
  it('is true for a User member holding an admin role', () => {
    expect(isEmailAdmin([user('admin@example.com', ['admin'])], 'admin@example.com')).toBe(true);
    expect(isEmailAdmin([user('admin@example.com', ['cluster-admin'])], 'ADMIN@EXAMPLE.COM')).toBe(true);
  });

  it('is false for a member without an admin role', () => {
    expect(isEmailAdmin([user('viewer@example.com', ['view'])], 'viewer@example.com')).toBe(false);
  });

  it('matches through an IdP prefix', () => {
    expect(isEmailAdmin([user('idpid:admin@sap.com', ['admin'])], 'admin@sap.com')).toBe(true);
  });

  it('ignores non-User kinds', () => {
    const members: Member[] = [{ kind: 'Group', name: 'admins@example.com', roles: ['admin'] }];
    expect(isEmailAdmin(members, 'admins@example.com')).toBe(false);
  });

  it('is false for a missing email or when the user is absent', () => {
    expect(isEmailAdmin([user('admin@example.com', ['admin'])], undefined)).toBe(false);
    expect(isEmailAdmin([user('admin@example.com', ['admin'])], 'other@example.com')).toBe(false);
  });
});
