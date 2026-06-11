// SPDX-FileCopyrightText: 2025 SAP SE or an SAP affiliate company and open-mcp-project contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { McpV2InputSchema } from './mcpV2Input.schema.ts';

const validInput = {
  name: 'my-mcp',
  namespace: 'project-foo',
  roleBindings: [
    {
      roleRefs: [{ kind: 'ClusterRole', name: 'cluster-admin' }],
      subjects: [{ kind: 'User', name: 'alice@example.com' }],
    },
  ],
};

describe('McpV2InputSchema', () => {
  it('accepts a fully valid input', () => {
    expect(McpV2InputSchema.safeParse(validInput).success).toBe(true);
  });

  it('accepts an input with no roleBindings', () => {
    const input = { ...validInput, roleBindings: [] };
    expect(McpV2InputSchema.safeParse(input).success).toBe(true);
  });

  it('rejects when name is empty', () => {
    const result = McpV2InputSchema.safeParse({ ...validInput, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects when namespace is empty', () => {
    const result = McpV2InputSchema.safeParse({ ...validInput, namespace: '' });
    expect(result.success).toBe(false);
  });

  it('rejects when name is missing', () => {
    const { name: _name, ...rest } = validInput;
    const result = McpV2InputSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  describe('RoleRefSchema', () => {
    it('accepts ClusterRole kind', () => {
      const input = {
        ...validInput,
        roleBindings: [{ roleRefs: [{ kind: 'ClusterRole', name: 'admin' }], subjects: [] }],
      };
      expect(McpV2InputSchema.safeParse(input).success).toBe(true);
    });

    it('accepts Role kind', () => {
      const input = {
        ...validInput,
        roleBindings: [{ roleRefs: [{ kind: 'Role', name: 'viewer' }], subjects: [] }],
      };
      expect(McpV2InputSchema.safeParse(input).success).toBe(true);
    });

    it('rejects an unknown roleRef kind', () => {
      const input = {
        ...validInput,
        roleBindings: [{ roleRefs: [{ kind: 'InvalidKind', name: 'admin' }], subjects: [] }],
      };
      expect(McpV2InputSchema.safeParse(input).success).toBe(false);
    });

    it('rejects an empty roleRef name', () => {
      const input = {
        ...validInput,
        roleBindings: [{ roleRefs: [{ kind: 'ClusterRole', name: '' }], subjects: [] }],
      };
      expect(McpV2InputSchema.safeParse(input).success).toBe(false);
    });

    it('rejects a roleBinding with no roleRefs', () => {
      const input = {
        ...validInput,
        roleBindings: [{ roleRefs: [], subjects: [] }],
      };
      expect(McpV2InputSchema.safeParse(input).success).toBe(false);
    });
  });

  describe('SubjectSchema', () => {
    it('accepts User kind', () => {
      const input = {
        ...validInput,
        roleBindings: [
          {
            roleRefs: [{ kind: 'ClusterRole', name: 'admin' }],
            subjects: [{ kind: 'User', name: 'bob@example.com' }],
          },
        ],
      };
      expect(McpV2InputSchema.safeParse(input).success).toBe(true);
    });

    it('accepts Group kind', () => {
      const input = {
        ...validInput,
        roleBindings: [
          {
            roleRefs: [{ kind: 'ClusterRole', name: 'admin' }],
            subjects: [{ kind: 'Group', name: 'devs' }],
          },
        ],
      };
      expect(McpV2InputSchema.safeParse(input).success).toBe(true);
    });

    it('accepts an optional apiGroup on a subject', () => {
      const input = {
        ...validInput,
        roleBindings: [
          {
            roleRefs: [{ kind: 'ClusterRole', name: 'admin' }],
            subjects: [{ kind: 'User', name: 'carol@example.com', apiGroup: 'rbac.authorization.k8s.io' }],
          },
        ],
      };
      expect(McpV2InputSchema.safeParse(input).success).toBe(true);
    });

    it('rejects an unknown subject kind', () => {
      const input = {
        ...validInput,
        roleBindings: [
          {
            roleRefs: [{ kind: 'ClusterRole', name: 'admin' }],
            subjects: [{ kind: 'ServiceAccount', name: 'sa-name' }],
          },
        ],
      };
      expect(McpV2InputSchema.safeParse(input).success).toBe(false);
    });

    it('rejects an empty subject name', () => {
      const input = {
        ...validInput,
        roleBindings: [
          {
            roleRefs: [{ kind: 'ClusterRole', name: 'admin' }],
            subjects: [{ kind: 'User', name: '' }],
          },
        ],
      };
      expect(McpV2InputSchema.safeParse(input).success).toBe(false);
    });
  });
});
