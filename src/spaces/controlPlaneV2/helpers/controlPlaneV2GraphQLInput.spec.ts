import { describe, it, expect } from 'vitest';
import { buildMcpV2GraphQLInput } from './controlPlaneV2GraphQLInput.ts';
import { McpV2Input } from '../../mcp/schemas/mcpV2Input.schema.ts';

const baseInput: McpV2Input = {
  name: 'my-mcp',
  namespace: 'project-x--ws-y',
  roleBindings: [
    {
      roleRefs: [{ kind: 'ClusterRole', name: 'cluster-admin' }],
      subjects: [{ kind: 'User', name: 'alice' }],
    },
  ],
  extraProviders: [],
};

describe('buildMcpV2GraphQLInput', () => {
  it('builds the correct apiVersion/kind/metadata', () => {
    const result = buildMcpV2GraphQLInput(baseInput);
    expect(result.apiVersion).toBe('core.open-control-plane.io/v2alpha1');
    expect(result.kind).toBe('ControlPlane');
    expect(result.metadata).toEqual({ name: 'my-mcp', namespace: 'project-x--ws-y' });
  });

  it('builds defaultProvider roleBindings with subject names trimmed and no apiGroup set', () => {
    const result = buildMcpV2GraphQLInput({
      ...baseInput,
      roleBindings: [
        {
          roleRefs: [{ kind: 'ClusterRole', name: 'cluster-admin' }],
          subjects: [{ kind: 'User', name: '  alice  ' }],
        },
      ],
    });
    expect(result.spec?.iam?.oidc?.defaultProvider?.roleBindings).toEqual([
      {
        roleRefs: [{ kind: 'ClusterRole', name: 'cluster-admin' }],
        subjects: [{ kind: 'User', name: 'alice' }],
      },
    ]);
  });

  it('sends an empty defaultProvider roleBindings array when the default provider is disabled', () => {
    const result = buildMcpV2GraphQLInput({ ...baseInput, roleBindings: [] });
    expect(result.spec?.iam?.oidc?.defaultProvider?.roleBindings).toEqual([]);
  });

  it('builds extraProviders with full metadata and role bindings', () => {
    const result = buildMcpV2GraphQLInput({
      ...baseInput,
      extraProviders: [
        {
          name: 'custom',
          issuer: 'https://openmcp.accounts.ondemand.com',
          clientID: 'client-id-1',
          usernameClaim: 'email',
          groupsClaim: 'groups',
          roleBindings: [
            {
              roleRefs: [{ kind: 'ClusterRole', name: 'cluster-admin' }],
              subjects: [{ kind: 'User', name: 'bob' }],
            },
          ],
        },
      ],
    });
    expect(result.spec?.iam?.oidc?.extraProviders).toEqual([
      {
        name: 'custom',
        issuer: 'https://openmcp.accounts.ondemand.com',
        clientID: 'client-id-1',
        usernameClaim: 'email',
        usernamePrefix: undefined,
        groupsClaim: 'groups',
        groupsPrefix: undefined,
        extraScopes: undefined,
        roleBindings: [
          {
            roleRefs: [{ kind: 'ClusterRole', name: 'cluster-admin' }],
            subjects: [{ kind: 'User', name: 'bob' }],
          },
        ],
      },
    ]);
  });

  it('preserves an explicitly disabled prefix ("") distinctly from an unset one (undefined)', () => {
    const result = buildMcpV2GraphQLInput({
      ...baseInput,
      extraProviders: [
        {
          name: 'custom',
          issuer: 'https://example.com',
          clientID: 'client-id-1',
          usernamePrefix: '',
          roleBindings: [],
        },
      ],
    });
    expect(result.spec?.iam?.oidc?.extraProviders?.[0]?.usernamePrefix).toBe('');
  });

  it('preserves an explicit custom prefix verbatim', () => {
    const result = buildMcpV2GraphQLInput({
      ...baseInput,
      extraProviders: [
        {
          name: 'custom',
          issuer: 'https://example.com',
          clientID: 'client-id-1',
          groupsPrefix: 'other-',
          roleBindings: [],
        },
      ],
    });
    expect(result.spec?.iam?.oidc?.extraProviders?.[0]?.groupsPrefix).toBe('other-');
  });

  it('omits extraScopes when empty', () => {
    const result = buildMcpV2GraphQLInput({
      ...baseInput,
      extraProviders: [
        { name: 'custom', issuer: 'https://example.com', clientID: 'client-id-1', extraScopes: [], roleBindings: [] },
      ],
    });
    expect(result.spec?.iam?.oidc?.extraProviders?.[0]?.extraScopes).toBeUndefined();
  });

  it('includes extraScopes when present', () => {
    const result = buildMcpV2GraphQLInput({
      ...baseInput,
      extraProviders: [
        {
          name: 'custom',
          issuer: 'https://example.com',
          clientID: 'client-id-1',
          extraScopes: ['profile', 'email'],
          roleBindings: [],
        },
      ],
    });
    expect(result.spec?.iam?.oidc?.extraProviders?.[0]?.extraScopes).toEqual(['profile', 'email']);
  });

  it('omits the annotations key entirely when no support field is set', () => {
    const result = buildMcpV2GraphQLInput(baseInput);
    expect(result.metadata).not.toHaveProperty('annotations');
  });

  it('writes only the non-empty support fields as meta.orchestrate.cloud.sap annotations', () => {
    const result = buildMcpV2GraphQLInput({
      ...baseInput,
      supportLandscape: 'production',
      supportServiceIds: 'ID-1, ID-2',
      supportSecurityContacts: '',
      supportOpsContacts: 'mail:ops@example.com',
    });
    expect(result.metadata?.annotations).toEqual({
      'meta.orchestrate.cloud.sap/landscape': 'production',
      'meta.orchestrate.cloud.sap/service-ids': 'ID-1, ID-2',
      'meta.orchestrate.cloud.sap/ops-contacts': 'mail:ops@example.com',
    });
  });

  it('writes the landscape annotation as empty string when Purpose is set to Not Selected', () => {
    const result = buildMcpV2GraphQLInput({
      ...baseInput,
      supportLandscape: '',
    });
    expect(result.metadata?.annotations).toEqual({
      'meta.orchestrate.cloud.sap/landscape': '',
    });
  });
});
