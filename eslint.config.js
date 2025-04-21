import eslint from "@eslint/js";
import { flatConfigs as importFlatConfigs } from "eslint-plugin-import";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";
import * as typescriptEslint from "typescript-eslint";
import vitest from "@vitest/eslint-plugin";
import jestDom from "eslint-plugin-jest-dom";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

const flat = typescriptEslint.config(
  eslint.configs.recommended,
  ...typescriptEslint.configs.recommended,
  prettierRecommended,
  importFlatConfigs.recommended,
  importFlatConfigs.typescript,
  {
    settings: {
      "import/resolver": {
        typescript: true,
        node: true,
      },
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.commonjs,
        ...globals.es2015,
        ...globals.jest,
        ...globals.node,
      },
      parser: typescriptEslint.parser,
      parserOptions: { projectService: true },
    },
    ignores: [
      "node_modules/",
      "build/",
      "dist/",
      "coverage/",
      ".eslintrc.js",
      ".eslintrc.cjs",
      "start.mjs",
      "start.js",
      "*.config.js",
      "plopfile.js",
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}"],
    rules: {
      // TypeScript's `noFallthroughCasesInSwitch` option is more robust (#6906)
      "default-case": "off",
      // 'tsc' already handles this (https://github.com/typescript-eslint/typescript-eslint/issues/291)
      "no-dupe-class-members": "off",
      // 'tsc' already handles this (https://github.com/typescript-eslint/typescript-eslint/issues/477)
      "no-undef": "off",

      // Add TypeScript specific rules (and turn off ESLint equivalents)
      "@typescript-eslint/consistent-type-assertions": "warn",
      "no-array-constructor": "off",
      "@typescript-eslint/no-array-constructor": "warn",
      "no-redeclare": "off",
      "@typescript-eslint/no-redeclare": "warn",
      "no-use-before-define": "off",
      "@typescript-eslint/no-use-before-define": [
        "warn",
        { functions: false, classes: false, variables: false, typedefs: false },
      ],
      "no-unused-expressions": "off",
      "@typescript-eslint/no-unused-expressions": [
        "error",
        { allowShortCircuit: true, allowTernary: true, allowTaggedTemplates: true },
      ],
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "no-useless-constructor": "off",
      "@typescript-eslint/no-useless-constructor": "warn",
      "@typescript-eslint/array-type": "error",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-empty-object-type": ["error", { allowInterfaces: "always" }],

      "prefer-const": "warn",
      "no-var": "error",
      "array-callback-return": "warn",
      "dot-location": ["warn", "property"],
      eqeqeq: ["warn", "smart"],
      "new-parens": "warn",
      "no-caller": "warn",
      "no-cond-assign": ["warn", "except-parens"],
      "no-const-assign": "warn",
      "no-control-regex": "warn",
      "no-delete-var": "warn",
      "no-dupe-args": "warn",
      "no-dupe-keys": "warn",
      "no-duplicate-case": "warn",
      "no-empty-character-class": "warn",
      "no-empty-pattern": "warn",
      "no-eval": "warn",
      "no-ex-assign": "warn",
      "no-extend-native": "warn",
      "no-extra-bind": "warn",
      "no-extra-label": "warn",
      "no-fallthrough": "warn",
      "no-func-assign": "warn",
      "no-implied-eval": "warn",
      "no-invalid-regexp": "warn",
      "no-iterator": "warn",
      "no-label-var": "warn",
      "no-labels": ["warn", { allowLoop: true, allowSwitch: false }],
      "no-lone-blocks": "warn",
      "no-loop-func": "warn",
      "no-mixed-operators": [
        "warn",
        {
          groups: [
            ["&", "|", "^", "~", "<<", ">>", ">>>"],
            ["==", "!=", "===", "!==", ">", ">=", "<", "<="],
            ["&&", "||"],
            ["in", "instanceof"],
          ],
          allowSamePrecedence: false,
        },
      ],
      "no-multi-str": "warn",
      "no-global-assign": "warn",
      "no-unsafe-negation": "warn",
      "no-new-func": "warn",
      "no-new-object": "warn",
      "no-new-symbol": "warn",
      "no-new-wrappers": "warn",
      "no-obj-calls": "warn",
      "no-octal": "warn",
      "no-octal-escape": "warn",
      "no-regex-spaces": "warn",
      "no-restricted-syntax": ["warn", "WithStatement"],
      "no-script-url": "warn",
      "no-self-assign": "warn",
      "no-self-compare": "warn",
      "no-sequences": "warn",
      "no-shadow-restricted-names": "warn",
      "no-sparse-arrays": "warn",
      "no-template-curly-in-string": "warn",
      "no-this-before-super": "warn",
      "no-throw-literal": "warn",
      "no-restricted-globals": "warn",
      "no-unreachable": "warn",
      "no-unused-labels": "warn",
      "no-useless-computed-key": "warn",
      "no-useless-concat": "warn",
      "no-useless-escape": "warn",
      "no-useless-rename": ["warn", { ignoreDestructuring: false, ignoreImport: false, ignoreExport: false }],
      "no-with": "warn",
      "no-whitespace-before-property": "warn",
      "require-yield": "warn",
      "rest-spread-spacing": ["warn", "never"],
      strict: ["warn", "never"],
      "unicode-bom": ["warn", "never"],
      "use-isnan": "warn",
      "valid-typeof": "warn",
      "no-restricted-properties": [
        "error",
        {
          object: "require",
          property: "ensure",
          message: "Please use import() instead",
        },
        {
          object: "System",
          property: "import",
          message: "Please use import() instead",
        },
      ],
      "getter-return": "warn",

      // https://github.com/import-js/eslint-plugin-import
      "import/no-unresolved": "off",
      "import/no-named-as-default-member": "off",
      "import/first": "error",
      "import/no-amd": "error",
      "import/no-anonymous-default-export": "warn",
      "import/no-webpack-loader-syntax": "error",
      "import/no-self-import": "error",
    },
  },
  {
    files: ["**/*.spec.ts?(x)"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);

const flatReact = [
  {
    // https://github.com/yannickcr/eslint-plugin-react
    files: ["**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}"],
    ...reactPlugin.configs.flat?.recommended,
    settings: {
      react: { version: "detect" },
      linkComponents: [{ name: "Link", linkAttribute: "to" }],
    },
    rules: {
      ...reactPlugin.configs.flat?.recommended.rules,
      "react/jsx-sort-props": ["warn", { callbacksLast: true, noSortAlphabetically: true, reservedFirst: true }],
      "react/prop-types": "off",
      "react/display-name": "off",
      "react/self-closing-comp": ["error", { component: true, html: true }],
    },
  },
  {
    // https://github.com/yannickcr/eslint-plugin-react
    files: ["**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}"],
    ...reactPlugin.configs.flat?.["jsx-runtime"],
  },
  {
    // https://github.com/jsx-eslint/eslint-plugin-jsx-a11y
    files: ["**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}"],
    ...jsxA11y.flatConfigs.recommended,
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      "jsx-a11y/media-has-caption": "off",
    },
  },
  {
    // https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks
    files: ["**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}"],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-hooks/rules-of-hooks": "error",
    },
  },
  {
    ...reactRefresh.configs.recommended,
    rules: {
      "react-refresh/only-export-components": "off",
    }
  },
  {
    // https://github.com/vitest-dev/eslint-plugin-vitest
    files: ["**/*.{test,spec}.{ts,tsx}"],
    // @ts-ignore
    ...vitest.configs.recommended,
    rules: {
      // @ts-ignore
      ...vitest.configs.recommended.rules,
      "vitest/expect-expect": "off",
    },
    languageOptions: {
      globals: {
        // @ts-ignore
        ...vitest.environments.env.globals,
      },
    },
  },
  {
    // https://github.com/testing-library/eslint-plugin-jest-dom
    files: ["**/*.{test,spec}.{ts,tsx}"],
    ...jestDom.configs["flat/recommended"],
  },
];

const config = [...flat, ...flatReact];

export default config;
