import type { ErrorLike } from '@apollo/client';

/** Result of a query kept fresh externally (e.g. a subscription) — no manual refetch needed. */
export type QueryResult<T> = {
  data: T;
  error: ErrorLike | null;
  isPending: boolean;
};

/** Result of an interval-polled query; refetch forces an immediate reload. */
export type PollingQueryResult<T> = QueryResult<T> & {
  refetch: () => Promise<T>;
};
