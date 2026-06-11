// SPDX-FileCopyrightText: 2025 SAP SE or an SAP affiliate company and open-mcp-project contributors
// SPDX-License-Identifier: Apache-2.0

import { act, renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ShellBarMcpActionsProvider, useShellBarMcpActions } from './ShellBarMcpActionsContext.tsx';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ShellBarMcpActionsProvider>{children}</ShellBarMcpActionsProvider>
);

describe('ShellBarMcpActionsContext', () => {
  describe('useShellBarMcpActions', () => {
    it('throws when used outside provider', () => {
      expect(() => renderHook(() => useShellBarMcpActions())).toThrow(
        'useShellBarMcpActions must be used within a ShellBarMcpActionsProvider',
      );
    });

    it('starts with all values undefined', () => {
      const { result } = renderHook(() => useShellBarMcpActions(), { wrapper });
      const {
        kubeconfig,
        mcpName,
        mcpDisplayName,
        namespace,
        roleBindings,
        project,
        workspace,
        onEditMcp,
        onOpenYaml,
        navigateBack,
      } = result.current;
      expect(kubeconfig).toBeUndefined();
      expect(mcpName).toBeUndefined();
      expect(mcpDisplayName).toBeUndefined();
      expect(namespace).toBeUndefined();
      expect(roleBindings).toBeUndefined();
      expect(project).toBeUndefined();
      expect(workspace).toBeUndefined();
      expect(onEditMcp).toBeUndefined();
      expect(onOpenYaml).toBeUndefined();
      expect(navigateBack).toBeUndefined();
    });
  });

  describe('setMcpActions', () => {
    it('sets kubeconfig and mcpName', () => {
      const { result } = renderHook(() => useShellBarMcpActions(), { wrapper });
      act(() => result.current.setMcpActions('my-kubeconfig', 'my-mcp'));
      expect(result.current.kubeconfig).toBe('my-kubeconfig');
      expect(result.current.mcpName).toBe('my-mcp');
    });

    it('sets optional fields when provided', () => {
      const { result } = renderHook(() => useShellBarMcpActions(), { wrapper });
      const roleBindings = [{ roleRef: { kind: 'ClusterRole', name: 'admin' }, subjects: [] }];
      act(() =>
        result.current.setMcpActions(
          'kc',
          'mcp',
          'My MCP',
          roleBindings as never,
          'my-project',
          'my-workspace',
          'my-namespace',
        ),
      );
      expect(result.current.mcpDisplayName).toBe('My MCP');
      expect(result.current.project).toBe('my-project');
      expect(result.current.workspace).toBe('my-workspace');
      expect(result.current.namespace).toBe('my-namespace');
      expect(result.current.roleBindings).toBe(roleBindings);
    });

    it('wires the onEditMcp callback', () => {
      const { result } = renderHook(() => useShellBarMcpActions(), { wrapper });
      const editFn = vi.fn();
      act(() =>
        result.current.setMcpActions('kc', 'mcp', undefined, undefined, undefined, undefined, undefined, editFn),
      );
      expect(result.current.onEditMcp).toBeDefined();
      result.current.onEditMcp?.();
      expect(editFn).toHaveBeenCalledOnce();
    });

    it('wires the navigateBack callback', () => {
      const { result } = renderHook(() => useShellBarMcpActions(), { wrapper });
      const backFn = vi.fn();
      act(() =>
        result.current.setMcpActions(
          'kc',
          'mcp',
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          backFn,
        ),
      );
      expect(result.current.navigateBack).toBeDefined();
      result.current.navigateBack?.();
      expect(backFn).toHaveBeenCalledOnce();
    });

    it('wires the onOpenYaml callback', () => {
      const { result } = renderHook(() => useShellBarMcpActions(), { wrapper });
      const yamlFn = vi.fn();
      act(() =>
        result.current.setMcpActions(
          'kc',
          'mcp',
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          yamlFn,
        ),
      );
      expect(result.current.onOpenYaml).toBeDefined();
      result.current.onOpenYaml?.();
      expect(yamlFn).toHaveBeenCalledOnce();
    });
  });

  describe('clearMcpActions', () => {
    it('resets all values back to undefined', () => {
      const { result } = renderHook(() => useShellBarMcpActions(), { wrapper });

      act(() => result.current.setMcpActions('kc', 'mcp', 'My MCP', undefined, 'proj', 'ws', 'ns'));
      expect(result.current.mcpName).toBe('mcp');

      act(() => result.current.clearMcpActions());

      expect(result.current.kubeconfig).toBeUndefined();
      expect(result.current.mcpName).toBeUndefined();
      expect(result.current.mcpDisplayName).toBeUndefined();
      expect(result.current.namespace).toBeUndefined();
      expect(result.current.roleBindings).toBeUndefined();
      expect(result.current.project).toBeUndefined();
      expect(result.current.workspace).toBeUndefined();
      expect(result.current.onEditMcp).toBeUndefined();
      expect(result.current.onOpenYaml).toBeUndefined();
      expect(result.current.navigateBack).toBeUndefined();
    });
  });
});
