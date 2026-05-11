---
name: testing
description: Guidelines for writing and running tests in the ui-frontend repository. Covers Cypress component tests, Vitest unit tests, test providers, and CI workflows. Use when working on test files, debugging test failures, or adding new tests.
user-invocable: false
---

# Testing in ui-frontend

This repository uses two testing frameworks:
- **Cypress** for component tests (files ending in `.cy.tsx`)
- **Vitest** for unit tests (files ending in `.spec.ts` or `.spec.tsx`)

## Running Tests Locally

### Cypress Component Tests

Run all component tests:
```bash
npm run test:cy
```

Run specific test file:
```bash
npm run test:cy -- --spec "src/components/Shared/CopyNamespaceButton.cy.tsx"
```

Open Cypress UI (interactive mode):
```bash
npm run test:cy:open
```

**Important**: Cypress runs with Chrome browser by default (`--browser chrome` is configured in package.json).

### Vitest Unit Tests

Run all unit tests:
```bash
npm run test:vi
```

Run specific test file:
```bash
npm run test:vi src/hooks/useCreateResource.spec.ts
```

Run in watch mode:
```bash
npm run test:vi --watch
```

## Writing Cypress Component Tests

### Required Providers

Many components require React context providers to function. Always wrap components with necessary providers:

```tsx
import { ComponentToTest } from './ComponentToTest.tsx';
import { CopyButtonProvider } from '../../context/CopyButtonContext.tsx';
import { ToastProvider } from '../../context/ToastContext.tsx';

describe('ComponentToTest', () => {
  const mountWithProviders = (component: React.ReactElement) => {
    return cy.mount(
      <ToastProvider>
        <CopyButtonProvider>
          {component}
        </CopyButtonProvider>
      </ToastProvider>,
    );
  };

  it('should render correctly', () => {
    mountWithProviders(<ComponentToTest />);
    // assertions...
  });
});
```

Common providers needed:
- `ToastProvider` - for components using toast notifications
- `CopyButtonProvider` - for copy-to-clipboard functionality
- `ApiConfigContext.Provider` - for API calls
- `McpContextProvider` - for MCP-specific components

### Stubbing Browser APIs

When testing components that use browser APIs like clipboard, stub them before mounting:

```tsx
it('should copy to clipboard', () => {
  // Stub clipboard API
  cy.window().then((win) => {
    const clipboardStub = {
      writeText: cy.stub().resolves(),
      readText: cy.stub().resolves(''),
    };

    Object.defineProperty(win.navigator, 'clipboard', {
      value: clipboardStub,
      writable: true,
      configurable: true,
    });
  });

  mountWithProviders(<Component />);
  
  // Test clipboard functionality
  cy.get('button').click();
  cy.get('[data-testid="success"]').should('exist');
});
```

### UI5 Web Components

Use the `@ui5/webcomponents-cypress-commands` for UI5-specific commands:

```tsx
import '@ui5/webcomponents-cypress-commands';

// Select UI5 components
cy.get('ui5-button[icon="copy"]').should('exist');
cy.get('ui5-button[design="Positive"]').should('exist');

// Trigger events with force: true if needed
button.trigger('mouseenter', { force: true });
button.trigger('mouseleave', { force: true });
```

### Waiting for Async Operations

Use explicit waits or timeout options for async operations:

```tsx
// Wait for animation
cy.wait(350);

// Wait for element with custom timeout
cy.get('ui5-button[design="Positive"]', { timeout: 5000 }).should('exist');
```

## Writing Vitest Unit Tests

### Basic Structure

```tsx
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMyHook } from './useMyHook';

describe('useMyHook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return expected value', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current).toEqual(expectedValue);
  });
});
```

### Mocking Dependencies

```tsx
vi.mock('../lib/api/fetch');
vi.mock('./useOtherHook', () => ({
  useOtherHook: () => ({ data: 'mocked' }),
}));
```

### Testing React Hooks

```tsx
import { act } from '@testing-library/react';

it('should update state', async () => {
  const { result } = renderHook(() => useMyHook());
  
  await act(async () => {
    await result.current.doSomething();
  });
  
  expect(result.current.value).toBe('updated');
});
```

## CI Pipeline

Tests run automatically on pull requests via GitHub Actions (`.github/workflows/build.yaml`):

1. **Lint** - `npm run lint`
2. **Type Check** - `npm run type-check`
3. **Vitest** - `npm run test:vi`
4. **Build** - `npm run build`
5. **Cypress** - `npm run test:cy`

CI runs on `ubuntu-latest` with Node.js 24 and Chrome browser.

## Common Test Patterns

### Testing Async Operations

```tsx
it('should handle async operation', async () => {
  const { result } = renderHook(() => useMyHook());
  
  await act(async () => {
    await result.current.fetchData();
  });
  
  expect(result.current.data).toBeDefined();
});
```

### Testing Error States

```tsx
it('should handle errors', async () => {
  fetchMock.mockRejectedValue(new Error('Network error'));
  
  const { result } = renderHook(() => useMyHook());
  
  await act(async () => {
    await result.current.fetchData();
  });
  
  expect(result.current.error).toBe('Network error');
});
```

### Testing UI Interactions

```tsx
it('should handle click', () => {
  mountWithProviders(<MyButton onClick={handleClick} />);
  
  cy.get('ui5-button').click();
  cy.get('[data-testid="result"]').should('contain', 'Clicked');
});
```

## Troubleshooting

### Cypress Fails Locally

If Cypress fails to verify on your machine but works in CI:
- The CI environment (Ubuntu + Chrome) is the source of truth
- Ensure your code changes work based on CI results
- Local Cypress issues are often environment-specific

### Flaky Tests

If tests pass/fail intermittently:
- Add appropriate waits for animations or async operations
- Use explicit timeouts: `cy.get('element', { timeout: 5000 })`
- Ensure proper cleanup in `beforeEach`/`afterEach`
- Use `{ force: true }` for interactions if elements are covered

### Tests Pass Locally But Fail in CI

- Check that all required providers are wrapped
- Verify that browser APIs are properly stubbed
- Ensure tests don't depend on timing or race conditions
- Check for hard-coded values that might differ in CI

## Best Practices

1. **Isolate Tests** - Each test should be independent and not rely on other tests
2. **Use Data Attributes** - Use `data-testid` for test-specific selectors
3. **Avoid Hardcoded Timeouts** - Use Cypress retry-ability instead of fixed `cy.wait()`
4. **Mock External Dependencies** - Don't make real API calls in tests
5. **Test User Behavior** - Test what users do, not implementation details
6. **Keep Tests Fast** - Mock heavy operations, use minimal fixtures
7. **Descriptive Test Names** - Clearly describe what is being tested

## TypeScript in Tests

Ensure proper typing for test variables:

```tsx
// Bad - implicit any
let result;
await act(async () => {
  result = await doSomething();
});

// Good - explicit type
let result: { success: boolean; data?: string } | undefined;
await act(async () => {
  result = await doSomething();
});
```

Use type assertions when needed:

```tsx
const mockFetch = vi.mocked(fetchApiServerJson);
const element = screen.getByRole('button') as HTMLButtonElement;
```
