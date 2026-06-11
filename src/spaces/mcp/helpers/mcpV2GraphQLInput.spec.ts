// SPDX-FileCopyrightText: 2025 SAP SE or an SAP affiliate company and open-mcp-project contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { buildMcpV2GraphQLInput } from './mcpV2GraphQLInput.ts';
import type { McpV2Input } from '../schemas/mcpV2Input.schema.ts';

const baseInput: McpV2Input = {
  name: 'my-mcp',
  namespace: 'project-foo',
  roleBindings: [
    {
      roleRefs: [{ kind: 'ClusterRole', name: 'cluster-admin' }],
      subjects: [{ kind: 'User', name: 'alice@example.com' }],
    },
  ],
};

describe('buildMcpV2GraphQLInput', () => {
  it('sets the correct apiVersion and kind', () => {
    const result = buildMcpV2GraphQLInput(baseInput);
    expect(result.apiVersion).toBe('core.openmcp.cloud/v2alpha1');
    expect(result.kind).toBe('ManagedControlPlaneV2');
  });

  it('maps name and namespace into metadata', () => {
    const result = buildMcpV2GraphQLInput(baseInput);
    expect(result.metadata?.name).toBe('my-mcp');
    expect(result.metadata?.namespace).toBe('project-foo');
  });

  it('maps roleRefs correctly', () => {
    const result = buildMcpV2GraphQLInput(baseInput);
    const rb = result.spec?.iam?.oidc?.defaultProvider?.roleBindings?.[0];
    expect(rb?.roleRefs).toEqual([{ kind: 'ClusterRole', name: 'cluster-admin' }]);
  });

  it('maps subjects and always sets apiGroup to rbac.authorization.k8s.io', () => {
    const result = buildMcpV2GraphQLInput(baseInput);
    const rb = result.spec?.iam?.oidc?.defaultProvider?.roleBindings?.[0];
    expect(rb?.subjects).toEqual([{ kind: 'User', name: 'alice@example.com', apiGroup: 'rbac.authorization.k8s.io' }]);
  });

  it('trims whitespace from subject names', () => {
    const input: McpV2Input = {
      ...baseInput,
      roleBindings: [
        {
          roleRefs: [{ kind: 'ClusterRole', name: 'admin' }],
          subjects: [{ kind: 'User', name: '  bob@example.com  ' }],
        },
      ],
    };
    const result = buildMcpV2GraphQLInput(input);
    const subject = result.spec?.iam?.oidc?.defaultProvider?.roleBindings?.[0]?.subjects?.[0];
    expect(subject?.name).toBe('bob@example.com');
  });

  it('handles multiple roleBindings', () => {
    const input: McpV2Input = {
      ...baseInput,
      roleBindings: [
        {
          roleRefs: [{ kind: 'ClusterRole', name: 'admin' }],
          subjects: [{ kind: 'User', name: 'alice@example.com' }],
        },
        {
          roleRefs: [{ kind: 'Role', name: 'viewer' }],
          subjects: [{ kind: 'Group', name: 'devs' }],
        },
      ],
    };
    const result = buildMcpV2GraphQLInput(input);
    const bindings = result.spec?.iam?.oidc?.defaultProvider?.roleBindings;
    expect(bindings).toHaveLength(2);
    expect(bindings?.[1]?.roleRefs?.[0]?.name).toBe('viewer');
    expect(bindings?.[1]?.subjects?.[0]?.kind).toBe('Group');
  });

  it('handles empty roleBindings array', () => {
    const input: McpV2Input = { ...baseInput, roleBindings: [] };
    const result = buildMcpV2GraphQLInput(input);
    expect(result.spec?.iam?.oidc?.defaultProvider?.roleBindings).toEqual([]);
  });

  it('handles multiple subjects per binding', () => {
    const input: McpV2Input = {
      ...baseInput,
      roleBindings: [
        {
          roleRefs: [{ kind: 'ClusterRole', name: 'admin' }],
          subjects: [
            { kind: 'User', name: 'alice@example.com' },
            { kind: 'Group', name: 'admins' },
          ],
        },
      ],
    };
    const result = buildMcpV2GraphQLInput(input);
    const subjects = result.spec?.iam?.oidc?.defaultProvider?.roleBindings?.[0]?.subjects;
    expect(subjects).toHaveLength(2);
    expect(subjects?.[1]?.name).toBe('admins');
  });
});
