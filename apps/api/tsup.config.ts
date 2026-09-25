import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  outDir: "dist",
  clean: true,
  target: "node24",
  // Empaqueta también las `dependencies`: dist/index.js corre sin node_modules.
  noExternal: [/./],
});
