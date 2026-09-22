import type { ErrorLike } from '@apollo/client';

/** Result of a query kept fresh externally (e.g. a subscription) — no manual refetch needed. */
export type QueryResult<T> = {
  data: T;
  error: ErrorLike | null;
  isPending: boolean;
  /**
   * True once the query has produced a result at least once. Lets consumers distinguish an
   * initial-load failure (show a dead-end error) from a transient refetch failure while
   * last-good data is still present (keep rendering it).
   */
  hasLoadedOnce?: boolean;
};

/** Result of an interval-polled query; refetch forces an immediate reload. */
export type PollingQueryResult<T> = QueryResult<T> & {
  refetch: () => Promise<T>;
};
