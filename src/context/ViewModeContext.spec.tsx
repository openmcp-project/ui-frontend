// SPDX-FileCopyrightText: 2025 SAP SE or an SAP affiliate company and open-mcp-project contributors
// SPDX-License-Identifier: Apache-2.0

import { act, renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FrontendConfigContext } from './FrontendConfigContext.tsx';
import { ViewModeProvider, useViewMode } from './ViewModeContext.tsx';

const baseConfig = {
  documentationBaseUrl: 'http://localhost',
  githubBaseUrl: 'http://localhost',
  featureToggles: { markMcpV1asDeprecated: false, enableMcpV2: false, enableHeadlamp: true },
};

const makeWrapper =
  (enableHeadlamp: boolean) =>
  ({ children }: { children: ReactNode }) => (
    <FrontendConfigContext.Provider
      value={{ ...baseConfig, featureToggles: { ...baseConfig.featureToggles, enableHeadlamp } }}
    >
      <ViewModeProvider>{children}</ViewModeProvider>
    </FrontendConfigContext.Provider>
  );

describe('ViewModeContext', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('defaults to beginner mode when nothing is stored', () => {
    const { result } = renderHook(() => useViewMode(), { wrapper: makeWrapper(true) });
    expect(result.current.mode).toBe('beginner');
  });

  it('falls back to beginner mode for any unknown stored value', () => {
    localStorage.setItem('mcp-ui-view-mode', 'some-unknown-value');
    const { result } = renderHook(() => useViewMode(), { wrapper: makeWrapper(true) });
    expect(result.current.mode).toBe('beginner');
  });

  it('restores open-source mode from localStorage when headlamp is enabled', () => {
    localStorage.setItem('mcp-ui-view-mode', 'open-source');
    const { result } = renderHook(() => useViewMode(), { wrapper: makeWrapper(true) });
    expect(result.current.mode).toBe('open-source');
  });

  it('switching back to beginner restores legacy mode', () => {
    localStorage.setItem('mcp-ui-view-mode', 'open-source');
    const { result } = renderHook(() => useViewMode(), { wrapper: makeWrapper(true) });

    expect(result.current.mode).toBe('open-source');
    act(() => result.current.setMode('beginner'));
    expect(result.current.mode).toBe('beginner');
  });

  it('headlampAvailable is true when enableHeadlamp flag is on', () => {
    const { result } = renderHook(() => useViewMode(), { wrapper: makeWrapper(true) });
    expect(result.current.headlampAvailable).toBe(true);
  });

  it('headlampAvailable is false when enableHeadlamp flag is off', () => {
    const { result } = renderHook(() => useViewMode(), { wrapper: makeWrapper(false) });
    expect(result.current.headlampAvailable).toBe(false);
  });

  it('mode initialises to beginner even if localStorage has open-source when flag is off', () => {
    localStorage.setItem('mcp-ui-view-mode', 'open-source');
    const { result } = renderHook(() => useViewMode(), { wrapper: makeWrapper(false) });
    expect(result.current.mode).toBe('beginner');
  });

  it('setMode to open-source is clamped to beginner when flag is off', () => {
    const { result } = renderHook(() => useViewMode(), { wrapper: makeWrapper(false) });
    act(() => result.current.setMode('open-source'));
    expect(result.current.mode).toBe('beginner');
  });
});
