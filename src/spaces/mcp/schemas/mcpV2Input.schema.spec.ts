import { describe, it, expect } from 'vitest';
import { ExtraProviderMetadataSchema, ExtraProviderInputSchema, McpV2InputSchema } from './mcpV2Input.schema.ts';

const validMetadata = {
  name: 'custom',
  issuer: 'https://openmcp.accounts.ondemand.com',
  clientID: 'fd55a276-bca8-43c2-9693-49194e1d323b',
};

const validRoleBinding = {
  roleRefs: [{ kind: 'ClusterRole' as const, name: 'cluster-admin' }],
  subjects: [{ kind: 'User' as const, name: 'alice' }],
};

describe('ExtraProviderMetadataSchema', () => {
  it('accepts a minimal valid provider', () => {
    expect(ExtraProviderMetadataSchema.safeParse(validMetadata).success).toBe(true);
  });

  it('accepts a provider with all optional advanced fields set', () => {
    const result = ExtraProviderMetadataSchema.safeParse({
      ...validMetadata,
      usernameClaim: 'email',
      usernamePrefix: '',
      groupsClaim: 'groups',
      groupsPrefix: 'custom-',
      extraScopes: ['profile', 'email'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects the reserved provider name "system"', () => {
    const result = ExtraProviderMetadataSchema.safeParse({ ...validMetadata, name: 'system' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid k8s-name-pattern provider name', () => {
    const result = ExtraProviderMetadataSchema.safeParse({ ...validMetadata, name: 'Not_Valid' });
    expect(result.success).toBe(false);
  });

  it('rejects a provider name longer than 253 chars', () => {
    const result = ExtraProviderMetadataSchema.safeParse({ ...validMetadata, name: 'a'.repeat(254) });
    expect(result.success).toBe(false);
  });

  it('rejects a missing issuer', () => {
    const { issuer: _issuer, ...withoutIssuer } = validMetadata;
    const result = ExtraProviderMetadataSchema.safeParse(withoutIssuer);
    expect(result.success).toBe(false);
  });

  it('rejects an issuer that is not a valid URL', () => {
    const result = ExtraProviderMetadataSchema.safeParse({ ...validMetadata, issuer: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing clientID', () => {
    const { clientID: _clientID, ...withoutClientID } = validMetadata;
    const result = ExtraProviderMetadataSchema.safeParse(withoutClientID);
    expect(result.success).toBe(false);
  });
});

describe('ExtraProviderInputSchema', () => {
  it('accepts a provider with roleBindings', () => {
    const result = ExtraProviderInputSchema.safeParse({ ...validMetadata, roleBindings: [validRoleBinding] });
    expect(result.success).toBe(true);
  });

  it('accepts a provider with an empty roleBindings array (newly added, no members yet)', () => {
    const result = ExtraProviderInputSchema.safeParse({ ...validMetadata, roleBindings: [] });
    expect(result.success).toBe(true);
  });
});

describe('McpV2InputSchema', () => {
  const base = { name: 'my-mcp', namespace: 'project-x--ws-y', roleBindings: [validRoleBinding] };

  it('accepts input with no extraProviders (defaults to an empty array)', () => {
    const result = McpV2InputSchema.parse(base);
    expect(result.extraProviders).toEqual([]);
  });

  it('accepts input with a single valid extra provider', () => {
    const result = McpV2InputSchema.safeParse({
      ...base,
      extraProviders: [{ ...validMetadata, roleBindings: [validRoleBinding] }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects duplicate extra provider names', () => {
    const result = McpV2InputSchema.safeParse({
      ...base,
      extraProviders: [
        { ...validMetadata, roleBindings: [] },
        { ...validMetadata, roleBindings: [] },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('accepts an empty default-provider roleBindings array (disabled default provider)', () => {
    const result = McpV2InputSchema.safeParse({ ...base, roleBindings: [] });
    expect(result.success).toBe(true);
  });
});
