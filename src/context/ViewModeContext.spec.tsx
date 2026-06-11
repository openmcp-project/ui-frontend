// SPDX-FileCopyrightText: 2025 SAP SE or an SAP affiliate company and open-mcp-project contributors
// SPDX-License-Identifier: Apache-2.0

import { act, renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ViewModeProvider, useViewMode } from './ViewModeContext.tsx';

const wrapper = ({ children }: { children: ReactNode }) => <ViewModeProvider>{children}</ViewModeProvider>;

describe('ViewModeContext', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('defaults to beginner mode (legacy UI) when nothing is stored', () => {
    const { result } = renderHook(() => useViewMode(), { wrapper });
    expect(result.current.mode).toBe('beginner');
  });

  it('falls back to beginner mode for any unknown stored value', () => {
    localStorage.setItem('mcp-ui-view-mode', 'some-unknown-value');
    const { result } = renderHook(() => useViewMode(), { wrapper });
    expect(result.current.mode).toBe('beginner');
  });

  it('switching back to beginner restores legacy mode', () => {
    localStorage.setItem('mcp-ui-view-mode', 'open-source');
    const { result } = renderHook(() => useViewMode(), { wrapper });

    expect(result.current.mode).toBe('open-source');
    act(() => result.current.setMode('beginner'));
    expect(result.current.mode).toBe('beginner');
  });

  it('headlampAvailable is true by default', () => {
    const { result } = renderHook(() => useViewMode(), { wrapper });
    expect(result.current.headlampAvailable).toBe(true);
  });

  it('when Headlamp becomes unavailable the switch is marked unavailable and mode reverts to beginner', () => {
    localStorage.setItem('mcp-ui-view-mode', 'open-source');
    const { result } = renderHook(() => useViewMode(), { wrapper });

    expect(result.current.mode).toBe('open-source');

    act(() => {
      result.current.setHeadlampAvailable(false);
      result.current.setMode('beginner');
    });

    expect(result.current.headlampAvailable).toBe(false);
    expect(result.current.mode).toBe('beginner');
  });

  it('headlampAvailable resets to true when availability is restored', () => {
    const { result } = renderHook(() => useViewMode(), { wrapper });

    act(() => result.current.setHeadlampAvailable(false));
    expect(result.current.headlampAvailable).toBe(false);

    act(() => result.current.setHeadlampAvailable(true));
    expect(result.current.headlampAvailable).toBe(true);
  });
});
