# New Components

## Before You Build

Check whether `@ui5/webcomponents-react` or `@ui5/webcomponents-fiori` already provides what you need. Also check `src/components/Ui/` for shared primitives. Building a custom `Button`, `Input`, `Dialog`, `Table`, or `Form` when a UI5 equivalent exists will be rejected in review.

Charts come from `@ui5/webcomponents-react-charts`.

---

## File Structure

Components live under `src/components/` in PascalCase folders:

```
src/components/
  MyFeature/
    MyFeature.tsx           ← component
    MyFeature.cy.tsx        ← component test
    index.ts                ← re-export (optional, for cleaner imports)
```

---

## Checklist

### 1. Design System First

Use UI5 components. Only reach for custom primitives for things UI5 genuinely doesn't offer.

### 2. Internationalise Strings

All user-facing strings must use `t()` from `react-i18next`. Add new keys to `src/utils/i18n/`. Hardcoded JSX literals fail lint (`eslint-plugin-i18next`).

```tsx
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
return <Title>{t('myFeature.title')}</Title>;
```

### 3. Sort JSX Props

ESLint enforces `react/jsx-sort-props` (reserved first, callbacks last, no alphabetical sort):

```tsx
// correct — ref/key first, event handlers last
<Button ref={ref} design="Emphasized" onClick={handleClick} />
```

### 4. Forms

Use `react-hook-form` + `zod` + `@hookform/resolvers`. Define a Zod schema, wire it with `zodResolver`, and drive UI5 inputs via RHF's `Controller`. See `src/components/Dialogs/CreateGitRepositoryDialog.tsx` for the canonical pattern.

### 5. Dialogs

Use `src/components/Dialogs/` as a reference. Prefer UI5's `Dialog` / `ResponsivePopover` — they handle focus trapping and accessibility.

### 6. YAML Editor

Route through `src/lib/monaco.ts`. Do not import `monaco-editor` directly.

---

## Writing the Component Test

Every non-trivial component needs a `*.cy.tsx` file. See [Testing](testing.md) for the full guide.

Key patterns:

```tsx
// Mount with required context providers
import { mountWithProviders } from '../../../cypress/support/mountWithProviders';

it('renders a title', () => {
  mountWithProviders(<MyFeature title="Hello" />);
  cy.contains('Hello').should('be.visible');
});
```

Use `deepEqualJson` when asserting emitted payloads — never `JSON.stringify` + `equal`.

---

- [Testing](testing.md) — full testing guide
- [New API Requests](new-api-request.md) — connecting components to data
