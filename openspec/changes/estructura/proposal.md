# Propuesta

## Por qué

"peluquita" es un repositorio greenfield: todavía no hay código de aplicación, ni tooling, ni CI, ni convenciones compartidas. Cualquier funcionalidad de producto (agenda, reservas online, señas, WhatsApp) necesita primero una base estable: un layout de monorepo reproducible, un stack elegido, quality gates y un camino de deploy. Sin eso, cada change futuro vuelve a decidir el tooling y el repositorio no puede construirse, testearse ni desplegarse de forma coherente.

## Qué cambia

- Crear un monorepo pnpm + Turborepo con workspaces: `apps/web`, `apps/api` y paquetes compartidos en `packages/`.
- Generar el scaffold de `apps/web` como app Next.js 15 (App Router) + TypeScript (estricto) + Tailwind, con una landing mínima y una ruta `/api/health`.
- Generar el scaffold de `apps/api` como servicio HTTP Hono que expone `GET /health`, con Dockerfile para deployment.
- Agregar `packages/config` (presets compartidos de ESLint, TypeScript, Prettier), `packages/shared` (código puro compartido) y `packages/db` (Prisma + PostgreSQL, local vía docker-compose).
- Agregar quality gates a nivel repo: `lint`, `typecheck`, `test` (Vitest) y `build` orquestados por Turborepo, más un e2e Playwright de nivel smoke.
- Agregar CI en GitHub Actions que corre el gate completo en los PRs, con configs de deploy para web (Vercel) y api (Railway + Dockerfile).
- Agregar onboarding: `README` raíz, `.env.example`, `.gitignore`, `.nvmrc`/`.npmrc` y hooks de pre-commit (lint-staged).
- **Sin features de producto** (sin auth, reservas, pagos, WhatsApp, admin): esas llegan en changes posteriores.

## Capacidades

### Nuevas capacidades

- `project-base`: la fundación estructural y de calidad del repositorio — layout del monorepo, apps web/api arrancables, cableado de base de datos, convenciones de env/secrets, quality gates, pipeline de CI/deploy y reproducibilidad del entorno de desarrollo.

### Capacidades modificadas

- Ninguna (greenfield: no hay specs existentes).

## Impacto

- **Código**: hoy no existe; todo lo agregado es nuevo. Archivos de config raíz (`package.json`, `pnpm-workspace.yaml`, `turbo.json`, `docker-compose.yml`, `.github/workflows/ci.yml`, `vercel.json`, README, ejemplos de env) más los árboles `apps/*` y `packages/*`.
- **Dependencias**: Node (vía `.nvmrc`), pnpm, Next.js 15, Hono, Prisma, Vitest, Playwright, Tailwind, TypeScript; contenedor PostgreSQL para desarrollo.
- **Sistemas**: CI en GitHub Actions (quality gates), Vercel (web), Railway (api + Postgres administrado, aprovisionamiento diferido).
- **OpenSpec**: introduce la primera spec de capability `project-base`; los futuros changes de producto declararán deltas sobre ella o agregarán nuevas capabilities.
