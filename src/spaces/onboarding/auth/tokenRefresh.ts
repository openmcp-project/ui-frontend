/**
 * Token refresh coordination for onboarding auth.
 *
 * This module connects React (AuthContext) with non-React code (fetch.ts, Apollo)
 * and ensures that:
 * - Only one refresh happens at a time, even across browser tabs (via Web Locks API)
 * - Callers can pause their requests while a refresh is in progress
 *
 * How it works:
 * - AuthContext registers the refresh logic via registerRefreshFn()
 * - Callers await refreshToken() before requests, which runs the registered logic if needed
 * - SWR uses useIsRefreshInProgress() to pause automatic refetches (re-renders when state changes)
 */

import { useSyncExternalStore } from 'react';

const LOCK_NAME = 'token-refresh-onboarding';

let isRefreshInProgress = false;
let pendingRefresh: Promise<boolean> | null = null;
let registeredRefreshFn: (() => Promise<boolean>) | null = null;

const listeners = new Set<() => void>();

export function registerRefreshFn(fn: () => Promise<boolean>): void {
  registeredRefreshFn = fn;
}

export async function refreshToken(): Promise<boolean> {
  if (!registeredRefreshFn) return true;

  if (!pendingRefresh) {
    pendingRefresh = performRefresh().finally(() => {
      pendingRefresh = null;
    });
  }

  return pendingRefresh;
}

export function useIsRefreshInProgress(): boolean {
  return useSyncExternalStore(subscribe, () => isRefreshInProgress);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

async function performRefresh(): Promise<boolean> {
  if (!registeredRefreshFn) return false;

  return navigator.locks.request(LOCK_NAME, async () => {
    if (!registeredRefreshFn) return false;

    isRefreshInProgress = true;
    notifyListeners();

    try {
      return await registeredRefreshFn();
    } finally {
      isRefreshInProgress = false;
      notifyListeners();
    }
  });
}
