/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Cache } from 'swr';

/**
 * SWR cache provider that persists entries to localStorage, scoped per MCP.
 *
 * Storage key shape: `mcp-ui:swr:v1:<project>:<workspace>:<mcpName>`.
 * Each MCP gets its own bucket — switching MCPs never overwrites another's
 * cache, and per-MCP wipe is a single `removeItem`.
 *
 * Why this exists: CRD lists and a few other near-static endpoints would
 * otherwise be re-fetched on every page reload. With this provider, SWR
 * hydrates the in-memory Map from localStorage at mount, paints cached data
 * instantly, then revalidates in the background.
 */

const PREFIX = 'mcp-ui:swr:v1:';
const MAX_BYTES_PER_BUCKET = 4 * 1024 * 1024; // 4 MB — under the 5 MB common quota
const PERSIST_DEBOUNCE_MS = 200;

export function storageKeyForMcp(mcpId: string): string {
  return `${PREFIX}${mcpId}`;
}

function hydrate(storageKey: string): Map<string, any> {
  if (typeof window === 'undefined') return new Map();
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return new Map();
    const entries = JSON.parse(raw) as [string, any][];
    return new Map(entries);
  } catch {
    return new Map();
  }
}

function persist(storageKey: string, map: Map<string, any>): void {
  if (typeof window === 'undefined') return;
  let entries: [string, any][] = Array.from(map.entries());
  let serialized = '';
  try {
    serialized = JSON.stringify(entries);
  } catch {
    return; // unserializable value somewhere — skip persist
  }
  // Trim oldest entries until under the size cap.
  while (serialized.length > MAX_BYTES_PER_BUCKET && entries.length > 1) {
    entries = entries.slice(Math.ceil(entries.length / 8));
    try {
      serialized = JSON.stringify(entries);
    } catch {
      return;
    }
  }
  try {
    window.localStorage.setItem(storageKey, serialized);
  } catch {
    // QuotaExceededError or privacy mode — ignore
  }
}

/**
 * Factory for an SWR `provider` callback. Returns a Map whose `set` is
 * intercepted to debounce-persist to localStorage under the MCP-scoped key.
 */
export function createPersistentProvider(mcpId: string): () => Cache<any> {
  return () => {
    const storageKey = storageKeyForMcp(mcpId);
    const map = hydrate(storageKey);
    let pending: ReturnType<typeof setTimeout> | null = null;
    const scheduleFlush = () => {
      if (pending) return;
      pending = setTimeout(() => {
        pending = null;
        persist(storageKey, map);
      }, PERSIST_DEBOUNCE_MS);
    };
    const originalSet = map.set.bind(map);
    map.set = (key, value) => {
      originalSet(key, value);
      scheduleFlush();
      return map;
    };
    const originalDelete = map.delete.bind(map);
    map.delete = (key) => {
      const r = originalDelete(key);
      scheduleFlush();
      return r;
    };
    return map;
  };
}

/**
 * Clear persisted SWR cache. With `mcpId`, wipes just that bucket; without,
 * wipes every `mcp-ui:swr:v1:*` key — call this on full logout.
 */
export function clearPersistedSwrCache(mcpId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (mcpId) {
      window.localStorage.removeItem(storageKeyForMcp(mcpId));
      return;
    }
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(PREFIX)) toRemove.push(k);
    }
    for (const k of toRemove) window.localStorage.removeItem(k);
  } catch {
    // ignore
  }
}
