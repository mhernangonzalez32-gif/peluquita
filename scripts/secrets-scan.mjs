#!/usr/bin/env node
/**
 * Escaneo de secretos del repositorio.
 *
 * Falla (exit 1) si encuentra entre los archivos COMMITEADOS o stageados
 * (lo que `git ls-files` lista):
 *  1. Archivos `.env` o `.env.*` (salvo `.env.example`, que es la plantilla
 *     commiteada a propósito). Un `.env` local sin trackear NO falla:
 *     es el estado normal de desarrollo.
 *  2. Patrones típicos de secretos (claves AWS, private keys, tokens).
 *
 * Sin git disponible, cae a un recorrido del filesystem (excluyendo
 * node_modules, .git y salidas generadas) como mejor esfuerzo.
 *
 * Uso: `pnpm secrets:scan` (también corre en CI).
 */
import { execSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  ".turbo",
  "coverage",
  "playwright-report",
  "test-results",
]);
const SKIP_FILES = new Set(["pnpm-lock.yaml", ".env.example"]);
const MAX_BYTES = 1024 * 1024;

const SECRET_PATTERNS = [
  { name: "AWS access key", re: /AKIA[0-9A-Z]{16}/ },
  { name: "private key", re: /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/ },
  { name: "GitHub token", re: /ghp_[A-Za-z0-9]{36}/ },
  { name: "live secret key", re: /sk-live-[A-Za-z0-9-_]{16,}/ },
  { name: "chat token", re: /xox[bpas]-[A-Za-z0-9-]+/ },
];

function base(name) {
  return name.split("/").pop();
}

function isEnvFile(relPath) {
  const name = base(relPath);
  return name === ".env" || (name.startsWith(".env.") && name !== ".env.example");
}

function trackedFiles() {
  try {
    const out = execSync("git ls-files -z", {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out.split("\0").filter(Boolean);
  } catch {
    return null;
  }
}

function walkFilesystem() {
  const found = [];
  (function walk(dir, rel) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(join(dir, entry.name), relPath);
      } else if (entry.isFile() && !SKIP_FILES.has(entry.name)) {
        found.push(relPath);
      }
    }
  })(ROOT, "");
  return found;
}

let files = trackedFiles();
if (files === null) {
  console.error("secrets:scan: sin git disponible, recorro el filesystem como mejor esfuerzo");
  files = walkFilesystem();
}

const envFiles = [];
const hits = [];

for (const relPath of files) {
  if (SKIP_FILES.has(base(relPath))) continue;
  if (isEnvFile(relPath)) {
    envFiles.push(relPath);
    continue;
  }
  try {
    const full = join(ROOT, relPath);
    if (statSync(full).size > MAX_BYTES) continue;
    const content = readFileSync(full, "utf8");
    if (content.includes("\0")) continue;
    for (const { name, re } of SECRET_PATTERNS) {
      if (re.test(content)) hits.push(`${relPath} (${name})`);
    }
  } catch {
    // Archivo ilegible: se ignora (no se puede afirmar que tenga secretos).
  }
}

let failed = false;
for (const f of envFiles) {
  console.error(`secrets:scan: archivo de entorno trackeado: ${f}`);
  failed = true;
}
for (const h of hits) {
  console.error(`secrets:scan: posible secreto en ${h}`);
  failed = true;
}

if (failed) {
  console.error("secrets:scan: FAILED");
  process.exitCode = 1;
} else {
  console.log("secrets:scan: OK (sin .env ni patrones de secretos en archivos trackeados)");
}
