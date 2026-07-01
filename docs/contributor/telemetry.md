# Adding Telemetry to a New Feature

When you add a new user-facing feature — a button, a shortcut, a wizard step — consider whether the product team should be able to see it get used. If yes, add one tracked event. This page shows exactly what to change.

For a deployment-oriented view of *how* events reach Sentry and Dynatrace, see the [Operator Telemetry doc](../operator/telemetry.md).

## Two-step recipe

### 1. Declare the event in `TelemetryFeature`

Open [`src/lib/telemetry/features.ts`](../../src/lib/telemetry/features.ts) and add a variant to the discriminated union:

```ts
export type TelemetryFeature =
  | Feature<'kubeconfig.copied'>
  | Feature<'kubeconfig.downloaded'>
  // ...existing events...
  | Feature<'my-feature.did-thing', { source: 'header' | 'card' }>;
//     ↑ event name         ↑ optional properties (all values must be string literals)
```

**Naming.** Use `dot.separated.lowercase-with-hyphens`. The first segment is the *feature area* (`project-list`, `kubeconfig`, `mcp`); the second is the *action* (`copied`, `navigated`, `set-as-default`). Reuse existing prefixes when the event belongs to the same area — that keeps Dynatrace dashboards groupable.

**Properties.** Everything after the name in the tuple is an object of string literals. Prefer **enums** over free-form strings — a `source: 'card' | 'detail'` is far more useful than `source: string` because it lets you slice the data confidently in the dashboard. The Dynatrace adapter coerces to strings anyway, but the TypeScript literal gives you compile-time enforcement everywhere the event is emitted.

**Don't** put user data in properties: no names, no IDs, no search queries, no free-form input. See [Operator Telemetry — what is not tracked](../operator/telemetry.md#what-is-not-tracked) for the full rationale.

### 2. Fire it from the component

```tsx
import { useTelemetry } from '../../lib/telemetry/telemetry';

function MyButton() {
  const telemetry = useTelemetry();

  const handleClick = () => {
    telemetry.track({ name: 'my-feature.did-thing', source: 'card' });
    //                        ↑ must exactly match a variant, TS enforces this
    doTheThing();
  };

  return <Button onClick={handleClick}>{t('MyFeature.button')}</Button>;
}
```

That's it. The event now reaches Sentry (as a breadcrumb attached to any subsequent error) and Dynatrace (as a `feature` action). In dev you'll see it logged to the browser console.

## Choosing between `track`, `report`, and `identify`

- **`track(feature)`** — Product analytics. Fire it whenever a user *does* something you might want to count later: click, keyboard shortcut, tab switch, search-enter.
- **`report(error, { message?, context? })`** — Error reporting. Use for caught exceptions where the user experience visibly degrades. Uncaught errors already reach Sentry via the global handler; you only need `report` for cases where you've caught the error yourself. See [`useApiResource`](../../src/lib/api/useApiResource.ts) for a canonical example.
- **`identify(user | null)`** — Called once from auth code on sign-in / sign-out. Feature authors should not need to touch this.

## Common patterns

### One event, two triggers

Add a property to distinguish the trigger rather than declaring two events. This keeps the dashboards tidy:

```ts
| Feature<'project-list.navigated', { trigger: 'click' | 'keyboard' }>;
```

```tsx
telemetry.track({ name: 'project-list.navigated', trigger: 'click' });     // Link onClick
telemetry.track({ name: 'project-list.navigated', trigger: 'keyboard' });  // Enter-in-search
```

### Loops — throttle at the call site, not the adapter

Every `track()` call reaches every adapter. If your event fires per keystroke, you'll spam Dynatrace. Debounce upstream:

```tsx
const debouncedTrack = useMemo(
  () => debounce(() => telemetry.track({ name: 'search.typed' }), 500),
  [telemetry],
);
```

Better still, track a *milestone* (`search.enter-pressed`, `search.result-clicked`) rather than an interaction rate.

### Injectable telemetry for tests

For components that are exercised in unit or component tests, expose `useTelemetry` as a prop with a default:

```tsx
import { useTelemetry as _useTelemetry } from '../../lib/telemetry/telemetry';

interface Props {
  useTelemetry?: typeof _useTelemetry;
}

export function MyButton({ useTelemetry = _useTelemetry }: Props) {
  const telemetry = useTelemetry();
  // ...
}
```

Tests can then pass a stub without needing to mock the whole module. See [`ConnectButton.tsx`](../../src/components/ControlPlanes/ConnectButton/ConnectButton.tsx) for a working example.

## What you don't have to think about

- **Adapter fan-out** — you always call `telemetry.track()`; the service decides which backends see it. Adding a fourth backend won't touch any call site.
- **Failure isolation** — if Dynatrace or Sentry throws inside its adapter, the `TelemetryService` catches it and logs to console. Your click handler will not blow up.
- **Environment detection** — `ConsoleAdapter` is auto-added in dev builds. Sentry SDK is auto-baked at build time. Dynatrace no-ops when its RUM script isn't present. You don't need env checks in feature code.
- **User identification** — handled globally in `AuthContextOnboarding`.

## Checklist before opening the PR

- [ ] New event declared in [`features.ts`](../../src/lib/telemetry/features.ts) as a `Feature<...>` variant.
- [ ] Properties use string-literal enums, not free-form `string`.
- [ ] No user-identifiable / user-supplied content in properties.
- [ ] Event fired from the actual user interaction, not from a `useEffect` triggered by state that could re-run.
- [ ] For loops / keystrokes: throttled, debounced, or reframed as a milestone.
- [ ] Ran locally (`npm run dev`) and confirmed the `[Telemetry] track ...` line appears in the browser console.

---

- [Operator: full architecture + what leaves the browser](../operator/telemetry.md)
- Back to [Contributor Guide](index.md)
