import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAllDenied, rememberDenied } from './downstreamAccessStore.ts';
import { useDownstreamAccess } from './useDownstreamAccess.ts';

describe('reactive downstream access', () => {
  beforeEach(() => {
    clearAllDenied();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('updates mounted readers on deny, exact expiry, and sign-out', () => {
    const { result, unmount } = renderHook(useDownstreamAccess);
    expect(result.current('p/w/cp/first')).toBe(false);
    act(() => rememberDenied('p/w/cp/first'));
    expect(result.current('p/w/cp/first')).toBe(true);
    expect(result.current('p/w/cp/second')).toBe(false);
    act(() => vi.advanceTimersByTime(15 * 60_000));
    expect(result.current('p/w/cp/first')).toBe(false);
    act(() => rememberDenied('p/w/cp/first'));
    act(clearAllDenied);
    expect(result.current('p/w/cp/first')).toBe(false);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
