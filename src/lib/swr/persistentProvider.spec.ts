import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearPersistedSwrCache, createPersistentProvider, storageKeyForMcp } from './persistentProvider';

const MCP_ID = 'agentic-runtime:dev:heuristic-curie';
const KEY = storageKeyForMcp(MCP_ID);

/**
 * The project's jsdom config doesn't expose a working localStorage to specs
 * (same blocker that breaks ViewModeContext.spec.tsx and rememberedProject.
 * spec.ts). Install a minimal in-memory shim on window+globalThis before each
 * test so this suite is self-contained.
 */
function installLocalStorageShim(): Storage {
  const store = new Map<string, string>();
  const shim: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k) => (store.has(k) ? (store.get(k) as string) : null),
    setItem: (k, v) => {
      store.set(k, String(v));
    },
    removeItem: (k) => {
      store.delete(k);
    },
    key: (i) => Array.from(store.keys())[i] ?? null,
  };
  Object.defineProperty(globalThis, 'localStorage', { value: shim, configurable: true });
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', { value: shim, configurable: true });
  }
  return shim;
}

beforeEach(() => {
  installLocalStorageShim();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('createPersistentProvider', () => {
  it('returns an empty Map when nothing is persisted', () => {
    const cache = createPersistentProvider(MCP_ID)();
    expect(cache.get('any')).toBeUndefined();
  });

  it('hydrates entries from a valid bucket', () => {
    const now = Date.now();
    localStorage.setItem(
      KEY,
      JSON.stringify({
        schemaVersion: 1,
        entries: [
          ['a', { ts: now, value: { data: 1 } }],
          ['b', { ts: now, value: { data: 'hello' } }],
        ],
      }),
    );
    const cache = createPersistentProvider(MCP_ID)();
    expect(cache.get('a')).toEqual({ data: 1 });
    expect(cache.get('b')).toEqual({ data: 'hello' });
  });

  it('drops entries older than the TTL on hydrate', () => {
    const stale = Date.now() - 31 * 60 * 1000; // 31 minutes ago
    const fresh = Date.now() - 60_000; // 1 minute ago
    localStorage.setItem(
      KEY,
      JSON.stringify({
        schemaVersion: 1,
        entries: [
          ['stale', { ts: stale, value: { data: 'old' } }],
          ['fresh', { ts: fresh, value: { data: 'new' } }],
        ],
      }),
    );
    const cache = createPersistentProvider(MCP_ID)();
    expect(cache.get('stale')).toBeUndefined();
    expect(cache.get('fresh')).toEqual({ data: 'new' });
  });

  it('rejects buckets with a different schemaVersion', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        schemaVersion: 99,
        entries: [['k', { ts: Date.now(), value: { data: 'x' } }]],
      }),
    );
    const cache = createPersistentProvider(MCP_ID)();
    expect(cache.get('k')).toBeUndefined();
  });

  it('rejects buckets with malformed JSON', () => {
    localStorage.setItem(KEY, '{not json');
    const cache = createPersistentProvider(MCP_ID)() as Map<string, unknown>;
    expect(cache.size).toBe(0);
  });

  it('persists entries with data after the debounce', () => {
    const cache = createPersistentProvider(MCP_ID)();
    cache.set('k', { data: { hello: 'world' } });
    expect(localStorage.getItem(KEY)).toBeNull(); // debounced — not flushed yet
    vi.advanceTimersByTime(300);
    const raw = localStorage.getItem(KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.entries).toEqual([['k', { ts: expect.any(Number), value: { data: { hello: 'world' } } }]]);
  });

  it('does not persist entries with an error', () => {
    const cache = createPersistentProvider(MCP_ID)();
    cache.set('k', { error: new Error('boom') });
    vi.advanceTimersByTime(300);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('does not persist entries with no data and no error', () => {
    const cache = createPersistentProvider(MCP_ID)();
    cache.set('k', { isLoading: true });
    vi.advanceTimersByTime(300);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('swallows quota-exceeded errors', () => {
    const cache = createPersistentProvider(MCP_ID)();
    const setItem = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      const e = new Error('QuotaExceededError');
      (e as any).name = 'QuotaExceededError';
      throw e;
    });
    cache.set('k', { data: 'x' });
    expect(() => vi.advanceTimersByTime(300)).not.toThrow();
    expect(setItem).toHaveBeenCalled();
  });

  it('evicts the LRU other-MCP bucket on quota error and retries', () => {
    // Seed two older buckets with different most-recent timestamps.
    const old1 = Date.now() - 10 * 60 * 1000;
    const old2 = Date.now() - 2 * 60 * 1000;
    localStorage.setItem(
      storageKeyForMcp('p1:w:older'),
      JSON.stringify({ schemaVersion: 1, entries: [['x', { ts: old1, value: { data: 1 } }]] }),
    );
    localStorage.setItem(
      storageKeyForMcp('p1:w:newer'),
      JSON.stringify({ schemaVersion: 1, entries: [['x', { ts: old2, value: { data: 2 } }]] }),
    );
    const cache = createPersistentProvider(MCP_ID)();
    // First call to setItem (writing the active MCP's bucket) throws Quota;
    // after we evict, subsequent calls succeed.
    let callsToActiveKey = 0;
    const realSetItem = localStorage.setItem.bind(localStorage);
    vi.spyOn(localStorage, 'setItem').mockImplementation((k: string, v: string) => {
      if (k === KEY) {
        callsToActiveKey++;
        if (callsToActiveKey === 1) {
          const e = new Error('QuotaExceededError');
          (e as any).name = 'QuotaExceededError';
          throw e;
        }
      }
      realSetItem(k, v);
    });
    cache.set('k', { data: 'x' });
    vi.advanceTimersByTime(300);
    // The older bucket should be gone; the newer should still be present.
    expect(localStorage.getItem(storageKeyForMcp('p1:w:older'))).toBeNull();
    expect(localStorage.getItem(storageKeyForMcp('p1:w:newer'))).not.toBeNull();
    // Active bucket was written on the retry.
    expect(localStorage.getItem(KEY)).not.toBeNull();
  });
});

describe('cross-MCP isolation', () => {
  it('two providers for different MCPs return distinct Maps and distinct buckets', () => {
    const a = createPersistentProvider('proj:ws:mcp-a')();
    const b = createPersistentProvider('proj:ws:mcp-b')();
    a.set('shared-key', { data: 'A' });
    b.set('shared-key', { data: 'B' });
    expect(a.get('shared-key')).toEqual({ data: 'A' });
    expect(b.get('shared-key')).toEqual({ data: 'B' });
    vi.advanceTimersByTime(300);
    expect(localStorage.getItem(storageKeyForMcp('proj:ws:mcp-a'))).toContain('"A"');
    expect(localStorage.getItem(storageKeyForMcp('proj:ws:mcp-b'))).toContain('"B"');
  });

  it("late callbacks on the old MCP's Map don't pollute the new MCP's bucket", () => {
    // Simulate the MCP-switch sequence: hook in MCP A mounts, fires a fetch,
    // user navigates to MCP B (new provider mounts), then A's fetch resolves
    // and calls cache.set on A's Map (the closure SWR captured).
    const oldMap = createPersistentProvider('proj:ws:old')();
    const newMap = createPersistentProvider('proj:ws:new')();
    // Late callback resolves into the old Map (this is correct behaviour —
    // SWR keeps the cache reference it was created with).
    oldMap.set('late-key', { data: 'from-old-mcp' });
    vi.advanceTimersByTime(300);
    expect(localStorage.getItem(storageKeyForMcp('proj:ws:old'))).toContain('from-old-mcp');
    expect(localStorage.getItem(storageKeyForMcp('proj:ws:new'))).toBeNull();
    expect(newMap.get('late-key')).toBeUndefined();
  });
});

describe('clearPersistedSwrCache', () => {
  beforeEach(() => {
    localStorage.setItem(storageKeyForMcp('a:b:c'), JSON.stringify({ schemaVersion: 1, entries: [] }));
    localStorage.setItem(storageKeyForMcp('x:y:z'), JSON.stringify({ schemaVersion: 1, entries: [] }));
    localStorage.setItem('mcp-ui:unrelated', 'keep me');
  });

  it('clears a single bucket when mcpId is given', () => {
    clearPersistedSwrCache('a:b:c');
    expect(localStorage.getItem(storageKeyForMcp('a:b:c'))).toBeNull();
    expect(localStorage.getItem(storageKeyForMcp('x:y:z'))).not.toBeNull();
    expect(localStorage.getItem('mcp-ui:unrelated')).toBe('keep me');
  });

  it('clears all swr buckets when mcpId is omitted', () => {
    clearPersistedSwrCache();
    expect(localStorage.getItem(storageKeyForMcp('a:b:c'))).toBeNull();
    expect(localStorage.getItem(storageKeyForMcp('x:y:z'))).toBeNull();
    expect(localStorage.getItem('mcp-ui:unrelated')).toBe('keep me');
  });
});
