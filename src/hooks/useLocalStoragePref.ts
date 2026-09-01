import { useCallback, useEffect, useState } from 'react';

const PREFIX = 'mcp-ui';

const buildKey = (key: string, scope?: string | (string | undefined)[]): string => {
  const tail = Array.isArray(scope) ? scope.filter(Boolean).join('/') : scope;
  return tail ? `${PREFIX}:${key}:${tail}` : `${PREFIX}:${key}`;
};

const read = <T>(storageKey: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
};

const write = <T>(storageKey: string, value: T) => {
  if (typeof window === 'undefined') return;
  try {
    if (value === undefined) {
      window.localStorage.removeItem(storageKey);
    } else {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    }
  } catch {
    // quota / privacy mode — ignore
  }
};

export function useLocalStoragePref<T>(
  key: string,
  defaultValue: T,
  scope?: string | (string | undefined)[],
): [T, (value: T | ((prev: T) => T)) => void] {
  const storageKey = buildKey(key, scope);
  const [value, setValue] = useState<T>(() => read(storageKey, defaultValue));

  // Re-read when the scope changes (e.g. user navigates between MCPs).
  useEffect(() => {
    // defaultValue is intentionally excluded — only re-read on scope change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(read(storageKey, defaultValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        write(storageKey, resolved);
        return resolved;
      });
    },
    [storageKey],
  );

  return [value, update];
}
