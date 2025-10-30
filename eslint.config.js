// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const importPlugin = require("eslint-plugin-import");
const unusedImports = require("eslint-plugin-unused-imports");
const eslintComments = require("eslint-plugin-eslint-comments");

module.exports = tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      ".angular/**",
      "coverage/**",
      "e2e/**",
      "playwright-report/**",
      "test-results/**",
      // Ignore auto-generated files
      "src/types/database.types.ts",
      "src/types/database.types.d.ts",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      import: importPlugin,
      "unused-imports": unusedImports,
      "eslint-comments": eslintComments,
    },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
      },
    },
    rules: {
      // TypeScript strict rules (adicionales a strictTypeChecked)
      "@typescript-eslint/explicit-function-return-type": ["error", {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
      }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/no-unused-vars": "off", // Handled by unused-imports
      "@typescript-eslint/consistent-type-imports": ["error", {
        prefer: "type-imports",
      }],
      "@typescript-eslint/consistent-type-exports": "error",
      "@typescript-eslint/no-inferrable-types": "off",

      // Unused imports
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": ["error", {
        vars: "all",
        varsIgnorePattern: "^_",
        args: "after-used",
        argsIgnorePattern: "^_",
      }],

      // Import order
      "import/order": ["error", {
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
        ],
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        },
        "newlines-between": "always",
      }],
      "import/newline-after-import": "error",

      // General code quality
      "no-console": ["warn", {
        allow: ["warn", "error"],
      }],
      "no-debugger": "error",
      "no-var": "error",
      "prefer-const": "error",
      "eqeqeq": ["error", "always"],
      "curly": ["error", "all"],

      // Template literal type safety
      "@typescript-eslint/restrict-template-expressions": ["error", {
        allowNumber: true,
        allowBoolean: true,
        allowAny: false,
        allowNullish: false,
      }],

      // Unnecessary conditionals (tune to reduce false positives)
      "@typescript-eslint/no-unnecessary-condition": ["warn", {
        allowConstantLoopConditions: true,
      }],

      // ESLint comment rules - enforce justifications for disables
      "eslint-comments/disable-enable-pair": "error",
      "eslint-comments/no-unlimited-disable": "error",
      "eslint-comments/require-description": ["error", {
        ignore: [],
      }],
    },
  },
  {
    // Relax rules ONLY for legacy utility files with auto-generated type dependencies
    // New code should use toError() helper and DTO parsing instead
    files: [
      "src/utils/type-guards.ts",
      "src/utils/validation.ts",
    ],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-redundant-type-constituents": "off",
    },
  },
  {
    // Test files
    files: ["**/*.spec.ts", "**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
    },
  }
);
