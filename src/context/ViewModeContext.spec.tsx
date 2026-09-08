// SPDX-FileCopyrightText: 2025 SAP SE or an SAP affiliate company and open-mcp-project contributors
// SPDX-License-Identifier: Apache-2.0

import { act, renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFrontendConfig } from './FrontendConfigContext.tsx';
import { ViewModeProvider, useViewMode } from './ViewModeContext.tsx';

vi.mock('./FrontendConfigContext.tsx', () => ({
  useFrontendConfig: vi.fn(),
}));

const mockConfig = (enableHeadlamp: boolean) => {
  vi.mocked(useFrontendConfig).mockReturnValue({
    featureToggles: { markMcpV1asDeprecated: false, enableMcpV2: false, enableHeadlamp },
  } as ReturnType<typeof useFrontendConfig>);
};

const wrapper = ({ children }: { children: ReactNode }) => <ViewModeProvider>{children}</ViewModeProvider>;

describe('ViewModeContext', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('defaults to beginner mode when nothing is stored', () => {
    mockConfig(true);
    const { result } = renderHook(() => useViewMode(), { wrapper });
    expect(result.current.mode).toBe('beginner');
  });

  it('falls back to beginner mode for any unknown stored value', () => {
    mockConfig(true);
    localStorage.setItem('mcp-ui-view-mode', 'some-unknown-value');
    const { result } = renderHook(() => useViewMode(), { wrapper });
    expect(result.current.mode).toBe('beginner');
  });

  it('restores open-source mode from localStorage when headlamp is enabled', () => {
    mockConfig(true);
    localStorage.setItem('mcp-ui-view-mode', 'open-source');
    const { result } = renderHook(() => useViewMode(), { wrapper });
    expect(result.current.mode).toBe('open-source');
  });

  it('switching back to beginner restores legacy mode', () => {
    mockConfig(true);
    localStorage.setItem('mcp-ui-view-mode', 'open-source');
    const { result } = renderHook(() => useViewMode(), { wrapper });
    expect(result.current.mode).toBe('open-source');
    act(() => result.current.setMode('beginner'));
    expect(result.current.mode).toBe('beginner');
  });

  it('headlampAvailable is true when enableHeadlamp flag is on', () => {
    mockConfig(true);
    const { result } = renderHook(() => useViewMode(), { wrapper });
    expect(result.current.headlampAvailable).toBe(true);
  });

  it('headlampAvailable is false when enableHeadlamp flag is off', () => {
    mockConfig(false);
    const { result } = renderHook(() => useViewMode(), { wrapper });
    expect(result.current.headlampAvailable).toBe(false);
  });

  it('mode initialises to beginner even if localStorage has open-source when flag is off', () => {
    mockConfig(false);
    localStorage.setItem('mcp-ui-view-mode', 'open-source');
    const { result } = renderHook(() => useViewMode(), { wrapper });
    expect(result.current.mode).toBe('beginner');
  });

  it('setMode to open-source is clamped to beginner when flag is off', () => {
    mockConfig(false);
    const { result } = renderHook(() => useViewMode(), { wrapper });
    act(() => result.current.setMode('open-source'));
    expect(result.current.mode).toBe('beginner');
  });
});
