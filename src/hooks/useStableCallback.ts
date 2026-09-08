import { useCallback, useEffect, useRef } from 'react';

/**
 * Returns a stable callback (same reference forever) that always invokes the
 * latest version of `fn`.
 *
 * Use this when a callback closes over context values that change often
 * (e.g. `apiConfig` from a context provider) but is consumed by a downstream
 * memo whose recompute is expensive — passing a fresh `useCallback` would
 * invalidate the memo on every parent render, in turn triggering whatever
 * heavy work the memo guards.
 *
 * The pattern is: store the latest `fn` in a ref (updated in an effect, not
 * during render — see https://react.dev/reference/react/useRef#updating-refs)
 * and expose a stable wrapper that dispatches through it.
 *
 * Concrete trigger in this repo: `Graph.tsx`'s YAML-open callback would
 * otherwise rebuild the Graph instance and re-run elkjs on every parent
 * render because `apiConfig` reference churns.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useStableCallback<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => TReturn,
): (...args: TArgs) => TReturn {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  return useCallback((...args: TArgs) => ref.current(...args), []);
}
