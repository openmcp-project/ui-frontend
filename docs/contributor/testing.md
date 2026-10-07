# Testing

This project uses three levels of testing. Choose the right level for what you are verifying.

## Overview

| Level | Tool | Scope | When to write |
|---|---|---|---|
| **Unit** | Vitest | Pure logic, hooks, utilities | Any function with branching logic that does not need a real DOM |
| **Component** | Cypress (`--component`) | Single React component in isolation | Visual behaviour, user interactions, integration with UI5 web components |
| **Smoke** | Playwright | Critical user journeys against a running app | End-to-end flows through the full stack |

---

## Unit Tests — Vitest

**Framework:** [Vitest](https://vitest.dev) · [Docs](https://vitest.dev/guide/) · [API Reference](https://vitest.dev/api/)  
**File pattern:** `*.spec.ts` / `*.spec.tsx`  
**Environment:** jsdom ([jsdom docs](https://github.com/jsdom/jsdom))  
**Run:**

```bash
npm run test:vi                         # all unit tests
npm run test:vi -- src/hooks/useX.spec.ts   # single file
```

**Write a unit test when:**
- The code contains conditional logic, data transformation, or error handling that doesn't require a rendered component.
- You are testing a custom hook (use `renderHook` from `@testing-library/react`).
- You are testing a pure utility in `src/utils/`.

**Do not** use unit tests to verify that a UI5 web component renders correctly — that requires a real browser DOM. Use a Cypress component test instead.

---

## Component Tests — Cypress

**Framework:** [Cypress](https://www.cypress.io) · [Component Testing Docs](https://docs.cypress.io/guides/component-testing/overview) · [API Reference](https://docs.cypress.io/api/table-of-contents)  
**File pattern:** `*.cy.tsx`  
**Browser:** Chrome, `--component` flag, `includeShadowDom: true` (required for [UI5 Web Components](https://sap.github.io/ui5-webcomponents/))  
**Run:**

```bash
npm run test:cy                                          # all component tests
npm run test:cy -- --spec 'src/components/Foo/Foo.cy.tsx'  # single file
npm run test:cy:open                                     # interactive mode
```

**Write a component test when:**
- You need to verify rendered output, user interactions (clicks, form input), or conditional rendering.
- The component uses UI5 web components — these require a real browser to render their shadow DOM.
- You are testing a dialog, wizard step, or table that has non-trivial mount/unmount behaviour.

### Asserting emitted YAML / JSON

Use the `deepEqualJson` custom command for structural equality — it normalises object key order before comparing so tests are not sensitive to serialisation order:

```typescript
cy.get('@onSubmit').its('args.0.0').deepEqualJson(expectedPayload);
```

This prevents the class of flakiness documented in [#649](https://github.com/openmcp-project/ui-frontend/pull/649).

---

## Smoke Tests — Playwright

**Framework:** [Playwright](https://playwright.dev) · [Docs](https://playwright.dev/docs/intro) · [API Reference](https://playwright.dev/docs/api/class-playwright)

Located in `smoke-test/` and `playwright/`.

**Write a smoke test when:**
- You need to verify a critical user journey end-to-end (login → create project → create workspace → create MCP).
- You want to catch regressions that only appear when the full BFF + backend stack is running.

Smoke tests require a running instance — they are not run in the standard `npm run test:cy` / `npm run test:vi` pipeline.

---

## CI Pipeline

All three quality gates run in CI on every PR (`on-pr.yaml`):

1. `npm run lint` — ESLint + npmPkgJsonLint
2. `npm run type-check` — `tsc --noEmit`
3. `npm run test:vi` — Vitest unit tests
4. `npm run test:cy` — Cypress component tests

Smoke tests run separately against a deployed environment.

See [Static Analysis](static-analysis.md) for details on the lint gates.

---

- [New Components](new-component.md) — component design and testing patterns
- [New API Requests](new-api-request.md) — hook and fetcher testing patterns
