/**
 * Factory for creating token refresh coordinators.
 *
 * Each coordinator ensures that:
 * - Only one refresh happens at a time, even across browser tabs (via Web Locks API)
 * - Callers can pause their requests while a refresh is in progress
 *
 * How it works:
 * - AuthContext registers the refresh logic via registerRefreshFn()
 * - Callers await refreshToken() before requests, which runs the registered logic if needed
 * - SWR uses useIsRefreshInProgress() to pause automatic refetches (re-renders when state changes)
 */

import { useSyncExternalStore } from 'react';

interface TokenRefreshCoordinator {
  registerRefreshFn: (fn: (force?: boolean) => Promise<boolean>) => void;
  refreshToken: (force?: boolean) => Promise<boolean>;
  useIsRefreshInProgress: () => boolean;
}

export function createTokenRefreshCoordinator(lockName: string): TokenRefreshCoordinator {
  let isRefreshInProgress = false;
  let pendingRefresh: Promise<boolean> | null = null;
  let registeredRefreshFn: ((force?: boolean) => Promise<boolean>) | null = null;

  const listeners = new Set<() => void>();

  function notifyListeners() {
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  async function performRefresh(force: boolean): Promise<boolean> {
    if (!registeredRefreshFn) return false;

    isRefreshInProgress = true;
    notifyListeners();

    try {
      return await registeredRefreshFn(force);
    } finally {
      isRefreshInProgress = false;
      notifyListeners();
    }
  }

  async function acquireLockAndRefresh(force: boolean): Promise<boolean> {
    if (!registeredRefreshFn) return false;

    // Fallback for browsers without Web Locks API
    if (!navigator.locks) {
      return performRefresh(force);
    }

    return await navigator.locks.request(lockName, () => performRefresh(force));
  }

  function registerRefreshFn(fn: (force?: boolean) => Promise<boolean>): void {
    registeredRefreshFn = fn;
  }

  async function refreshToken(force = false): Promise<boolean> {
    if (!registeredRefreshFn) return true;

    if (!pendingRefresh) {
      pendingRefresh = acquireLockAndRefresh(force).finally(() => {
        pendingRefresh = null;
      });
    }

    return pendingRefresh;
  }

  function useIsRefreshInProgress(): boolean {
    return useSyncExternalStore(subscribe, () => isRefreshInProgress);
  }

  return { registerRefreshFn, refreshToken, useIsRefreshInProgress };
}
