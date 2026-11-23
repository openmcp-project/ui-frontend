import { ApolloLink, Observable } from '@apollo/client';

/**
 * Subscriptions travel over SSE (`graphql-sse`), which MSW does not transparently
 * serve. In mock mode we swap the real `SSELink` for this idle link so that
 * `useSubscription` mounts cleanly and never opens a network connection to the
 * (unavailable) GraphQL gateway. Queries/mutations keep going through the HTTP
 * link, where MSW intercepts them.
 *
 * The returned observable stays open and emits nothing — mirroring a real SSE
 * subscription that is connected but has received no events yet. It must NOT call
 * `complete()`: an observable that completes synchronously makes Apollo's
 * `useSubscription` treat the stream as ended and re-subscribe on the next render,
 * producing an infinite re-render/re-subscribe loop.
 *
 * If you later need scripted live updates, emit fixtures here keyed by the
 * operation name (via `getMainDefinition(operation.query)`) instead of staying idle.
 */
export function createMockSubscriptionLink(): ApolloLink {
  return new ApolloLink(
    () =>
      new Observable(() => {
        // No next(), no complete() — stay open until Apollo unsubscribes.
        return () => {};
      }),
  );
}
