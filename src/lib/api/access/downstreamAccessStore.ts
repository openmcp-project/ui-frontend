/**
 * Remembers confirmed "no access" results for a downstream (control plane)
 * cluster, keyed per connect option. An SSAR against a control plane needs a
 * token from that control plane's IdP, which only exists after the user has
 * connected once — so the card cannot ask up front. Instead, the page gate
 * writes a deny here after a connect, and the connect button reads it.
 *
 * Only a confirmed deny is ever written. Never a network error, a 401, or a
 * control plane that is not ready.
 *
 * Backed by sessionStorage with an in-memory fallback, so a storage exception
 * (private mode, quota, disabled) never breaks the UI. Entries expire after
 * 15 minutes so access granted meanwhile recovers without clearing storage.
 */

const STORAGE_KEY = 'downstreamAccessDenied';
const EXPIRY_MS = 15 * 60 * 1000;

type DeniedEntry = { at: number };
type DeniedMap = Record<string, DeniedEntry>;

let memoryFallback: DeniedMap = {};
let storageUnavailable = false;
const listeners = new Set<() => void>();
let expiryTimer: ReturnType<typeof setTimeout> | undefined;

export interface DownstreamAccessKeyParts {
  project: string;
  workspace: string;
  controlPlane: string;
  idp?: string;
}

/**
 * Build the per-option key. Access is per IdP, so one denied IdP must not
 * disable the others; the IdP is part of the key.
 */
export function downstreamAccessKey({ project, workspace, controlPlane, idp }: DownstreamAccessKeyParts): string {
  return `${project}/${workspace}/${controlPlane}/${idp ?? 'openmcp'}`;
}

function readMap(): DeniedMap {
  if (storageUnavailable) return { ...memoryFallback };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    const map: DeniedMap = {};
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      for (const [key, entry] of Object.entries(parsed)) {
        if (
          entry &&
          typeof entry === 'object' &&
          'at' in entry &&
          typeof entry.at === 'number' &&
          Number.isFinite(entry.at) &&
          entry.at <= Date.now() &&
          Date.now() - entry.at < EXPIRY_MS
        ) {
          map[key] = { at: entry.at };
        }
      }
    }
    memoryFallback = map;
    return { ...map };
  } catch {
    storageUnavailable = true;
    return { ...memoryFallback };
  }
}

function writeMap(map: DeniedMap): void {
  // Keep the in-memory copy in sync so reads still work if storage throws.
  memoryFallback = { ...map };
  try {
    if (storageUnavailable) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    storageUnavailable = true;
  }
}

function notify(): void {
  listeners.forEach((listener) => listener());
  scheduleExpiry();
}

function scheduleExpiry(): void {
  clearTimeout(expiryTimer);
  if (!listeners.size) return;
  const expiries = Object.values(readMap())
    .map(({ at }) => at + EXPIRY_MS)
    .filter((at) => at > Date.now());
  if (expiries.length) expiryTimer = setTimeout(notify, Math.min(...expiries) - Date.now());
}

/** Notify mounted buttons on writes, expiry, focus, and storage changes. */
export function subscribeDenied(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) {
    window.addEventListener('focus', notify);
    window.addEventListener('storage', notify);
  }
  scheduleExpiry();
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      clearTimeout(expiryTimer);
      window.removeEventListener('focus', notify);
      window.removeEventListener('storage', notify);
    }
  };
}

// Stable primitive for useSyncExternalStore; reading a snapshot has no writes.
export function deniedSnapshot(): string {
  return JSON.stringify(
    Object.entries(readMap())
      .filter(([, entry]) => Date.now() - entry.at < EXPIRY_MS)
      .map(([key]) => key)
      .sort(),
  );
}

export function rememberDenied(key: string): void {
  const map = readMap();
  map[key] = { at: Date.now() };
  writeMap(map);
  notify();
}

export function clearDenied(key: string): void {
  const map = readMap();
  if (key in map) {
    delete map[key];
    writeMap(map);
    notify();
  }
}

export function isDenied(key: string): boolean {
  const map = readMap();
  const entry = map[key];
  if (!entry) return false;
  return Date.now() - entry.at < EXPIRY_MS;
}

/** Clear every remembered deny. Call on sign-out. */
export function clearAllDenied(): void {
  memoryFallback = {};
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    storageUnavailable = false;
  } catch {
    storageUnavailable = true;
  }
  notify();
}
