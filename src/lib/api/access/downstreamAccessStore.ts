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

const memoryFallback: DeniedMap = {};

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
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...memoryFallback };
    return JSON.parse(raw) as DeniedMap;
  } catch {
    return { ...memoryFallback };
  }
}

function writeMap(map: DeniedMap): void {
  // Keep the in-memory copy in sync so reads still work if storage throws.
  for (const k of Object.keys(memoryFallback)) delete memoryFallback[k];
  Object.assign(memoryFallback, map);
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // in-memory fallback already updated
  }
}

export function rememberDenied(key: string): void {
  const map = readMap();
  map[key] = { at: Date.now() };
  writeMap(map);
}

export function clearDenied(key: string): void {
  const map = readMap();
  if (key in map) {
    delete map[key];
    writeMap(map);
  }
}

export function isDenied(key: string): boolean {
  const map = readMap();
  const entry = map[key];
  if (!entry) return false;
  if (Date.now() - entry.at > EXPIRY_MS) {
    // Expired: drop it so the next connect re-evaluates.
    delete map[key];
    writeMap(map);
    return false;
  }
  return true;
}

/** Clear every remembered deny. Call on sign-out. */
export function clearAllDenied(): void {
  for (const k of Object.keys(memoryFallback)) delete memoryFallback[k];
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // in-memory already cleared
  }
}
