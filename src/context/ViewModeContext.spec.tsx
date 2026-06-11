// SPDX-FileCopyrightText: 2025 SAP SE or an SAP affiliate company and open-mcp-project contributors
// SPDX-License-Identifier: Apache-2.0

import { act, renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ViewModeProvider, useViewMode } from './ViewModeContext.tsx';

const wrapper = ({ children }: { children: ReactNode }) => <ViewModeProvider>{children}</ViewModeProvider>;

describe('ViewModeContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('useViewMode', () => {
    it('throws when used outside provider', () => {
      expect(() => renderHook(() => useViewMode())).toThrow('useViewMode must be used within a ViewModeProvider');
    });

    it('defaults to beginner mode when localStorage is empty', () => {
      const { result } = renderHook(() => useViewMode(), { wrapper });
      expect(result.current.mode).toBe('beginner');
    });

    it('restores open-source mode from localStorage', () => {
      localStorage.setItem('mcp-ui-view-mode', 'open-source');
      const { result } = renderHook(() => useViewMode(), { wrapper });
      expect(result.current.mode).toBe('open-source');
    });

    it('defaults to beginner mode for an unknown stored value', () => {
      localStorage.setItem('mcp-ui-view-mode', 'unknown-value');
      const { result } = renderHook(() => useViewMode(), { wrapper });
      expect(result.current.mode).toBe('beginner');
    });

    it('setMode updates the mode state', () => {
      const { result } = renderHook(() => useViewMode(), { wrapper });
      act(() => result.current.setMode('open-source'));
      expect(result.current.mode).toBe('open-source');
    });

    it('setMode persists the new mode to localStorage', () => {
      const { result } = renderHook(() => useViewMode(), { wrapper });
      act(() => result.current.setMode('open-source'));
      expect(localStorage.getItem('mcp-ui-view-mode')).toBe('open-source');
    });

    it('setMode can switch back to beginner', () => {
      localStorage.setItem('mcp-ui-view-mode', 'open-source');
      const { result } = renderHook(() => useViewMode(), { wrapper });
      act(() => result.current.setMode('beginner'));
      expect(result.current.mode).toBe('beginner');
      expect(localStorage.getItem('mcp-ui-view-mode')).toBe('beginner');
    });
  });
});
