import js from "@eslint/js";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", ".next/**", "node_modules/**", "next-env.d.ts"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "jsx-a11y": jsxA11y, "react-hooks": reactHooks },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      ...reactHooks.configs.flat.recommended.rules,
      "react-hooks/set-state-in-effect": "off",
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    files: ["worker/**/*.ts"],
    languageOptions: { globals: { ...globals.serviceworker } },
  },
  {
    files: ["tests/**/*.mjs"],
    languageOptions: { globals: { ...globals.node } },
  },
);
