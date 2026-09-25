import prettierConfig from "eslint-config-prettier";
import tseslint from "typescript-eslint";

/**
 * Configuración base compartida de ESLint (flat config).
 * Los workspaces la componen en su propio `eslint.config.mjs`:
 *
 *   import { baseEslintConfig } from "@peluquita/config/eslint.base.mjs";
 *   export default [...baseEslintConfig];
 */
// NOTA: los `ignores` de salidas generadas (.next, dist, coverage...) NO van acá:
// en flat config los patrones se resuelven relativo al archivo de config que
// los declara, así que cada consumidor (raíz y workspaces) declara los suyos.
export const baseEslintConfig = [
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
];
