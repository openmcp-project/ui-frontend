import { describe, it, expect, vi } from 'vitest';
import { createTokenRefreshCoordinator } from './createTokenRefreshCoordinator';

describe('createTokenRefreshCoordinator', () => {
  it('returns true (no-op) when no refresh fn is registered', async () => {
    const { refreshToken } = createTokenRefreshCoordinator('test-none');
    expect(await refreshToken()).toBe(true);
  });

  it('passes the force flag through to the registered refresh fn', async () => {
    const { registerRefreshFn, refreshToken } = createTokenRefreshCoordinator('test-force');
    const fn = vi.fn(async (force?: boolean) => force === true);
    registerRefreshFn(fn);

    expect(await refreshToken()).toBe(false); // default force=false
    expect(await refreshToken(true)).toBe(true); // forced

    expect(fn).toHaveBeenNthCalledWith(1, false);
    expect(fn).toHaveBeenNthCalledWith(2, true);
  });

  it('single-flights concurrent refreshes into one call', async () => {
    const { registerRefreshFn, refreshToken } = createTokenRefreshCoordinator('test-single');
    let resolveFn: (v: boolean) => void = () => {};
    const fn = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolveFn = resolve;
        }),
    );
    registerRefreshFn(fn);

    const a = refreshToken(true);
    const b = refreshToken(true);
    resolveFn(true);

    expect(await a).toBe(true);
    expect(await b).toBe(true);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
