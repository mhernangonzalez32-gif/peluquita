import { baseEslintConfig } from "@peluquita/config/eslint.base.mjs";

// Config raíz: la usa el hook de pre-commit (corre desde la raíz del repo).
// Cada workspace suma sus reglas propias en su propio eslint.config.mjs
// (p. ej. apps/web agrega next/core-web-vitals); el hook siempre aplica
// al menos esta base compartida.
export default [
  {
    ignores: [
      "**/.next/**",
      "**/dist/**",
      "**/coverage/**",
      "**/playwright-report/**",
      "**/test-results/**",
      "**/next-env.d.ts",
    ],
  },
  ...baseEslintConfig,
];
