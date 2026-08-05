import { describe, expect, it } from 'vitest';
import { Member } from '../../../lib/api/types/shared/members.ts';
import { ExtraProviderMetadata } from '../../mcp/schemas/mcpV2Input.schema.ts';
import { hasAssignedIamMember } from './hasAssignedIamMember.ts';

const member = (overrides: Partial<Member> = {}): Member => ({
  kind: 'User',
  name: 'someone@example.com',
  roles: ['cluster-admin'],
  ...overrides,
});

const provider = (overrides: Partial<ExtraProviderMetadata> = {}): ExtraProviderMetadata => ({
  name: 'custom',
  issuer: 'https://example.com',
  clientID: 'client-id',
  ...overrides,
});

describe('hasAssignedIamMember', () => {
  it('returns false when there are no members and no providers', () => {
    expect(hasAssignedIamMember([], [], true)).toBe(false);
  });

  it('returns false when the default provider has members but is disabled', () => {
    expect(hasAssignedIamMember([member()], [], false)).toBe(false);
  });

  it('returns true when the default provider is enabled and has a member', () => {
    expect(hasAssignedIamMember([member()], [], true)).toBe(true);
  });

  it('returns false when an extra provider exists but has no members', () => {
    expect(hasAssignedIamMember([], [provider()], false)).toBe(false);
  });

  it('returns true when an extra provider has a member, even with the default provider disabled', () => {
    expect(hasAssignedIamMember([member({ provider: 'custom' })], [provider()], false)).toBe(true);
  });

  it('returns false when members are tagged for a provider that no longer exists', () => {
    expect(hasAssignedIamMember([member({ provider: 'deleted-provider' })], [provider()], true)).toBe(false);
  });

  it('returns true when only one of several extra providers has a member', () => {
    const providers = [provider({ name: 'a' }), provider({ name: 'b' })];
    expect(hasAssignedIamMember([member({ provider: 'b' })], providers, false)).toBe(true);
  });
});
