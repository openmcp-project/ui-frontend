import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { YamlApplyContextProvider, useYamlApply } from './YamlApplyContext';

const wrapper = ({ children }: { children: ReactNode }) => (
  <YamlApplyContextProvider>{children}</YamlApplyContextProvider>
);

const file = (name: string) => new File([`kind: ConfigMap\n`], name, { type: 'application/yaml' });

describe('YamlApplyContext — requestApplyFiles routing', () => {
  it('starts a new flow (sets pendingFiles) when no append handler is registered', () => {
    const { result } = renderHook(() => useYamlApply(), { wrapper });

    act(() => result.current.requestApplyFiles([file('a.yaml')]));

    expect(result.current.pendingFiles).toHaveLength(1);
  });

  it('appends to the open dialog instead of replacing the queue when a handler is registered', () => {
    const { result } = renderHook(() => useYamlApply(), { wrapper });

    // Simulate the open dialog registering its append handler.
    const append = vi.fn();
    act(() => result.current.registerAppendHandler(append));

    act(() => result.current.requestApplyFiles([file('b.yaml')]));

    // Routed to the handler; the queue (pendingFiles) is NOT replaced — no in-progress edits lost.
    expect(append).toHaveBeenCalledTimes(1);
    expect(append.mock.calls[0][0]).toHaveLength(1);
    expect(result.current.pendingFiles).toHaveLength(0);
  });

  it('returns to starting a new flow after the handler is unregistered', () => {
    const { result } = renderHook(() => useYamlApply(), { wrapper });
    const append = vi.fn();

    act(() => result.current.registerAppendHandler(append));
    act(() => result.current.registerAppendHandler(null));
    act(() => result.current.requestApplyFiles([file('c.yaml')]));

    expect(append).not.toHaveBeenCalled();
    expect(result.current.pendingFiles).toHaveLength(1);
  });

  it('ignores an empty file list', () => {
    const { result } = renderHook(() => useYamlApply(), { wrapper });
    const append = vi.fn();
    act(() => result.current.registerAppendHandler(append));

    act(() => result.current.requestApplyFiles([]));

    expect(append).not.toHaveBeenCalled();
    expect(result.current.pendingFiles).toHaveLength(0);
  });
});
