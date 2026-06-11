// SPDX-FileCopyrightText: 2025 SAP SE or an SAP affiliate company and open-mcp-project contributors
// SPDX-License-Identifier: Apache-2.0

import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useYamlPreview, type YamlPreviewFields } from './useYamlPreview.ts';
import {
  CHARGING_TARGET_LABEL,
  CHARGING_TARGET_TYPE_LABEL,
  DISPLAY_NAME_ANNOTATION,
} from '../lib/api/types/shared/keyNames.ts';

const baseFields: YamlPreviewFields = {
  name: 'my-project',
  members: [],
};

describe('useYamlPreview', () => {
  describe('project type', () => {
    it('generates yaml with correct apiVersion and kind', () => {
      const { result } = renderHook(() => useYamlPreview(baseFields, 'project'));
      expect(result.current).toContain('apiVersion: core.openmcp.cloud/v1alpha1');
      expect(result.current).toContain('kind: Project');
    });

    it('uses <name> placeholder when name is empty', () => {
      const { result } = renderHook(() => useYamlPreview({ ...baseFields, name: '' }, 'project'));
      expect(result.current).toContain('name: <name>');
    });

    it('includes the resource name in metadata', () => {
      const { result } = renderHook(() => useYamlPreview(baseFields, 'project'));
      expect(result.current).toContain('name: my-project');
    });

    it('does not include namespace for project type', () => {
      const { result } = renderHook(() => useYamlPreview(baseFields, 'project', 'project-namespace'));
      expect(result.current).not.toContain('namespace:');
    });
  });

  describe('workspace type', () => {
    it('generates yaml with kind Workspace', () => {
      const { result } = renderHook(() => useYamlPreview(baseFields, 'workspace'));
      expect(result.current).toContain('kind: Workspace');
    });

    it('includes namespace when projectNamespace is provided', () => {
      const { result } = renderHook(() => useYamlPreview({ ...baseFields, name: 'my-ws' }, 'workspace', 'project-foo'));
      expect(result.current).toContain('namespace: project-foo');
    });

    it('does not include namespace when projectNamespace is absent', () => {
      const { result } = renderHook(() => useYamlPreview(baseFields, 'workspace'));
      expect(result.current).not.toContain('namespace:');
    });
  });

  describe('annotations and labels', () => {
    it('includes displayName annotation when provided', () => {
      const fields: YamlPreviewFields = { ...baseFields, displayName: 'My Project' };
      const { result } = renderHook(() => useYamlPreview(fields, 'project'));
      expect(result.current).toContain(`${DISPLAY_NAME_ANNOTATION}: My Project`);
    });

    it('omits annotations block when displayName is not provided', () => {
      const { result } = renderHook(() => useYamlPreview(baseFields, 'project'));
      expect(result.current).not.toContain('annotations:');
    });

    it('includes chargingTargetType label when provided', () => {
      const fields: YamlPreviewFields = { ...baseFields, chargingTargetType: 'cost-center' };
      const { result } = renderHook(() => useYamlPreview(fields, 'project'));
      expect(result.current).toContain(`${CHARGING_TARGET_TYPE_LABEL}: cost-center`);
    });

    it('includes chargingTarget label when provided', () => {
      const fields: YamlPreviewFields = { ...baseFields, chargingTarget: 'CC-1234' };
      const { result } = renderHook(() => useYamlPreview(fields, 'project'));
      expect(result.current).toContain(`${CHARGING_TARGET_LABEL}: CC-1234`);
    });

    it('omits labels block when no label fields are provided', () => {
      const { result } = renderHook(() => useYamlPreview(baseFields, 'project'));
      expect(result.current).not.toContain('labels:');
    });
  });

  describe('members', () => {
    it('includes User members in spec', () => {
      const fields: YamlPreviewFields = {
        ...baseFields,
        members: [{ kind: 'User', name: 'alice@example.com', roles: ['admin'] }],
      };
      const { result } = renderHook(() => useYamlPreview(fields, 'project'));
      expect(result.current).toContain('alice@example.com');
      expect(result.current).toContain('admin');
    });

    it('filters out members with an empty name', () => {
      const fields: YamlPreviewFields = {
        ...baseFields,
        members: [
          { kind: 'User', name: '', roles: ['admin'] },
          { kind: 'User', name: 'bob@example.com', roles: ['view'] },
        ],
      };
      const { result } = renderHook(() => useYamlPreview(fields, 'project'));
      expect(result.current).not.toContain("name: ''");
      expect(result.current).toContain('bob@example.com');
    });

    it('adds namespace: default for ServiceAccount members without a namespace', () => {
      const fields: YamlPreviewFields = {
        ...baseFields,
        members: [{ kind: 'ServiceAccount', name: 'my-sa', roles: ['view'] }],
      };
      const { result } = renderHook(() => useYamlPreview(fields, 'project'));
      expect(result.current).toContain('namespace: default');
    });

    it('uses the provided namespace for ServiceAccount members', () => {
      const fields: YamlPreviewFields = {
        ...baseFields,
        members: [{ kind: 'ServiceAccount', name: 'my-sa', roles: ['view'], namespace: 'custom-ns' }],
      };
      const { result } = renderHook(() => useYamlPreview(fields, 'project'));
      expect(result.current).toContain('namespace: custom-ns');
    });

    it('does not add namespace for non-ServiceAccount members', () => {
      const fields: YamlPreviewFields = {
        ...baseFields,
        members: [{ kind: 'User', name: 'alice@example.com', roles: ['admin'] }],
      };
      const { result } = renderHook(() => useYamlPreview(fields, 'project'));
      // No namespace key on that member entry
      const lines = result.current.split('\n');
      const aliceIndex = lines.findIndex((l) => l.includes('alice@example.com'));
      const memberBlock = lines.slice(aliceIndex - 2, aliceIndex + 5).join('\n');
      expect(memberBlock).not.toContain('namespace:');
    });
  });
});
