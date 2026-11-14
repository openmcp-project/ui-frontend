import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { rememberDenied, clearDenied, isDenied, clearAllDenied, downstreamAccessKey } from './downstreamAccessStore.ts';

describe('downstreamAccessStore', () => {
  beforeEach(() => {
    sessionStorage.clear();
    clearAllDenied();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('remembers and reports a denied key', () => {
    const key = downstreamAccessKey({ project: 'p', workspace: 'w', controlPlane: 'cp', idp: 'idpA' });
    expect(isDenied(key)).toBe(false);
    rememberDenied(key);
    expect(isDenied(key)).toBe(true);
  });

  it('clears a denied key', () => {
    const key = downstreamAccessKey({ project: 'p', workspace: 'w', controlPlane: 'cp', idp: 'idpA' });
    rememberDenied(key);
    clearDenied(key);
    expect(isDenied(key)).toBe(false);
  });

  it('is keyed per IdP so one denied IdP does not disable others', () => {
    const base = { project: 'p', workspace: 'w', controlPlane: 'cp' };
    const keyA = downstreamAccessKey({ ...base, idp: 'idpA' });
    const keyB = downstreamAccessKey({ ...base, idp: 'idpB' });
    rememberDenied(keyA);
    expect(isDenied(keyA)).toBe(true);
    expect(isDenied(keyB)).toBe(false);
  });

  it('defaults a missing IdP to "openmcp" in the key', () => {
    expect(downstreamAccessKey({ project: 'p', workspace: 'w', controlPlane: 'cp' })).toBe('p/w/cp/openmcp');
  });

  it('expires an entry after 15 minutes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const key = downstreamAccessKey({ project: 'p', workspace: 'w', controlPlane: 'cp' });
    rememberDenied(key);
    expect(isDenied(key)).toBe(true);

    vi.setSystemTime(new Date('2026-01-01T00:14:00Z'));
    expect(isDenied(key)).toBe(true);

    vi.setSystemTime(new Date('2026-01-01T00:16:00Z'));
    expect(isDenied(key)).toBe(false);
  });

  it('clears all entries', () => {
    const keyA = downstreamAccessKey({ project: 'p', workspace: 'w', controlPlane: 'a' });
    const keyB = downstreamAccessKey({ project: 'p', workspace: 'w', controlPlane: 'b' });
    rememberDenied(keyA);
    rememberDenied(keyB);
    clearAllDenied();
    expect(isDenied(keyA)).toBe(false);
    expect(isDenied(keyB)).toBe(false);
  });

  it('falls back to memory when sessionStorage throws', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });

    const key = downstreamAccessKey({ project: 'p', workspace: 'w', controlPlane: 'cp' });
    rememberDenied(key);
    expect(isDenied(key)).toBe(true);

    setItemSpy.mockRestore();
    getItemSpy.mockRestore();
  });
});
