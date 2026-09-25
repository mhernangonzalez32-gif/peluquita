import { baseEslintConfig } from "@peluquita/config/eslint.base.mjs";

export default [{ ignores: ["dist/**"] }, ...baseEslintConfig];
