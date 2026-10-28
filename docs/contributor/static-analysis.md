# Static Analysis

All of these gates run in CI on every PR and **must pass with zero warnings**. Do not use `--no-verify`, `--max-warnings auto`, or file-wide `eslint-disable` comments to paper over failures.

## ESLint

```bash
npm run lint              # eslint + npmPkgJsonLint (zero warnings)
npm run lint:eslint:fix   # auto-fix what ESLint can fix
```

Notable rules enforced:

| Rule | What it checks |
|---|---|
| `react/jsx-sort-props` | Reserved props first, callbacks last |
| `react/self-closing-comp` | Self-close tags with no children |
| `i18next/no-literal-string` | No hardcoded user-facing strings in JSX |
| `eslint-plugin-prettier/recommended` | Code formatting via Prettier |
| `import/order` | Import grouping and ordering |

Config: `eslint.config.js`

## TypeScript

```bash
npm run type-check   # tsc --noEmit
```

Config: `tsconfig.json` (client), `tsconfig.server.json` (BFF), `tsconfig.spec.json` (tests).

Key settings: strict mode enabled. Do not add `@ts-ignore` or `@ts-expect-error` without a comment explaining why.

## Prettier

Formatting is enforced via `eslint-plugin-prettier` — running `npm run lint:eslint:fix` formats the file. Config: `.prettierrc`.

## npmPkgJsonLint

```bash
# runs as part of npm run lint
```

Enforces `prefer-absolute-version-dependencies` and `prefer-absolute-version-devDependencies` — all versions in `package.json` must be pinned exactly (no `^` or `~`).

## Running All Gates Locally

```bash
npm run lint         # ESLint + npmPkgJsonLint
npm run type-check   # TypeScript
npm run test:vi      # Vitest unit tests
npm run test:cy      # Cypress component tests
```

This mirrors the CI pipeline in `.github/workflows/on-pr.yaml`.

---

- [Testing](testing.md) — test suite details
- [Contributor Guide](index.md) — setup and build
